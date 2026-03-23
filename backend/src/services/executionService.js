const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Local Code Execution Service
 *
 * Executes code locally via child_process with:
 *   - 10-second timeout
 *   - Temp-file isolation (auto-cleaned)
 *   - Support for Python, JavaScript (Node), C++, Java
 *
 * No external API required — runs directly on the host machine.
 */

const TIMEOUT_MS = 10000; // 10 second execution timeout

// ── Detect available runtimes on the system ──────────────────────────────────
const commandExists = (cmd) => {
    try {
        if (os.platform() === 'win32') {
            execSync(`where ${cmd}`, { stdio: 'pipe' });
        } else {
            execSync(`which ${cmd}`, { stdio: 'pipe' });
        }
        return true;
    } catch {
        return false;
    }
};

// Cache results so we only check once per process lifetime
const _cache = {};
const isAvailable = (cmd) => {
    if (!(cmd in _cache)) _cache[cmd] = commandExists(cmd);
    return _cache[cmd];
};

// Resolve the correct python command for this OS
const getPythonCmd = () => {
    if (isAvailable('python3')) return 'python3';
    if (isAvailable('python'))  return 'python';
    if (isAvailable('py'))      return 'py';
    return null;
};

const LANGUAGE_CONFIGS = {
    python:     { ext: '.py',   getCmd: getPythonCmd },
    javascript: { ext: '.js',   getCmd: () => isAvailable('node') ? 'node' : null },
    cpp:        { ext: '.cpp',  getCmd: () => isAvailable('g++')  ? 'g++' : null, compiled: true },
    java:       { ext: '.java', getCmd: () => isAvailable('javac') ? 'javac' : null, compiled: true },
};

/**
 * Execute user code locally in an isolated temp directory
 * @param {string} code     - Source code
 * @param {string} language - python | javascript | cpp | java
 * @param {string} stdin    - Optional standard input
 * @returns {{ output, error, exitCode, executionTime }}
 */
const executeCode = async (code, language, stdin = '') => {
    const startTime = Date.now();
    const config = LANGUAGE_CONFIGS[language];

    if (!config) {
        return { output: '', error: `Language '${language}' is not supported.`, exitCode: 1, executionTime: 0 };
    }

    const runtimeCmd = config.getCmd();
    if (!runtimeCmd) {
        const installHint = {
            python: 'Install Python from https://python.org',
            javascript: 'Install Node.js from https://nodejs.org',
            cpp: 'Install MinGW (g++) or MSYS2 for C++ compilation',
            java: 'Install JDK from https://adoptium.net',
        };
        return {
            output: '',
            error: `${language} runtime not found on this system.\n${installHint[language] || ''}`,
            exitCode: 1,
            executionTime: 0,
        };
    }

    // Create isolated temp directory
    const tmpDir = path.join(os.tmpdir(), `interview-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    const filename = language === 'java' ? 'Solution.java' : `solution${config.ext}`;
    const filepath = path.join(tmpDir, filename);
    fs.writeFileSync(filepath, code, 'utf-8');

    try {
        if (language === 'cpp') {
            // Compile then run
            const outName = os.platform() === 'win32' ? 'solution.exe' : 'solution';
            const outpath = path.join(tmpDir, outName);
            const compileResult = await runProcess('g++', ['-O2', '-std=c++17', '-o', outpath, filepath], tmpDir, '', TIMEOUT_MS);
            if (compileResult.exitCode !== 0) {
                return { output: '', error: compileResult.error || compileResult.output, exitCode: 1, executionTime: Date.now() - startTime };
            }
            const result = await runProcess(outpath, [], tmpDir, stdin, TIMEOUT_MS);
            return { ...result, executionTime: Date.now() - startTime };

        } else if (language === 'java') {
            // Compile then run
            const compileResult = await runProcess('javac', [filepath], tmpDir, '', TIMEOUT_MS);
            if (compileResult.exitCode !== 0) {
                return { output: '', error: compileResult.error || compileResult.output, exitCode: 1, executionTime: Date.now() - startTime };
            }
            const result = await runProcess('java', ['-cp', tmpDir, 'Solution'], tmpDir, stdin, TIMEOUT_MS);
            return { ...result, executionTime: Date.now() - startTime };

        } else {
            // Interpreted: python / javascript
            const result = await runProcess(runtimeCmd, [filepath], tmpDir, stdin, TIMEOUT_MS);
            return { ...result, executionTime: Date.now() - startTime };
        }

    } catch (error) {
        return { output: '', error: error.message || 'Execution failed', exitCode: 1, executionTime: Date.now() - startTime };
    } finally {
        // Cleanup temp files
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    }
};

/**
 * Spawn a process, capture stdout/stderr, enforce timeout
 */
const runProcess = (cmd, args, cwd, stdin, timeout) => {
    return new Promise((resolve, reject) => {
        const proc = spawn(cmd, args, {
            cwd,
            stdio: ['pipe', 'pipe', 'pipe'],
            windowsHide: true,
        });

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (d) => { stdout += d.toString(); });
        proc.stderr.on('data', (d) => { stderr += d.toString(); });

        if (stdin) { proc.stdin.write(stdin); }
        proc.stdin.end();

        const timer = setTimeout(() => {
            proc.kill('SIGKILL');
            reject(new Error('⏱ Time Limit Exceeded (10s)'));
        }, timeout);

        proc.on('close', (code) => {
            clearTimeout(timer);
            resolve({
                output: stdout.trim(),
                error: stderr.trim(),
                exitCode: code ?? 0,
            });
        });

        proc.on('error', (err) => {
            clearTimeout(timer);
            reject(new Error(`Failed to start ${cmd}: ${err.message}`));
        });
    });
};

/**
 * Analyze code patterns locally for complexity estimation
 */
const analyzeCodePatterns = (code) => {
    const patterns = [];

    const loopMatches = code.match(/for|while/g) || [];
    if (loopMatches.length >= 2) patterns.push('nested-loops');

    if (/def\s+(\w+)[^:]+:[\s\S]*?\1\s*\(/.test(code) ||
        /function\s+(\w+)[^{]+{[\s\S]*?\1\s*\(/.test(code)) {
        patterns.push('recursion');
    }

    if (/\.sort\(|sorted\(|Arrays\.sort|Collections\.sort/.test(code)) {
        patterns.push('sorting');
    }

    if (/dict\(|HashMap|unordered_map|Map\(/.test(code)) {
        patterns.push('hash-map');
    }

    return patterns;
};

module.exports = { executeCode, analyzeCodePatterns };
