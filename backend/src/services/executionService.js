const { v4: uuidv4 } = require('uuid');

/**
 * Docker-based code execution sandbox
 * 
 * Each piece of code runs in an isolated temporary Docker container with:
 * - Time limits (2 seconds max)
 * - Memory limits (64MB)
 * - No network access
 * - No filesystem persistence
 * - Auto-destroyed after execution
 * 
 * NOTE: Requires Docker to be installed and running on the server.
 * Falls back to a simulated execution if Docker is unavailable.
 */

let Docker;
let dockerAvailable = false;

// Try to load dockerode - gracefully fail if not available
try {
    Docker = require('dockerode');
    dockerAvailable = true;
} catch (e) {
    console.warn('⚠️  Dockerode not available. Code execution will be simulated.');
}

const LANGUAGE_CONFIGS = {
    python: {
        image: 'python:3.11-alpine',
        filename: 'solution.py',
        runCmd: ['python', 'solution.py'],
        timeout: 10000, // ms to pull/start container
    },
    javascript: {
        image: 'node:18-alpine',
        filename: 'solution.js',
        runCmd: ['node', 'solution.js'],
        timeout: 10000,
    },
    cpp: {
        image: 'gcc:latest',
        filename: 'solution.cpp',
        runCmd: ['sh', '-c', 'g++ -O2 -o solution solution.cpp && ./solution'],
        timeout: 15000,
    },
    java: {
        image: 'openjdk:17-alpine',
        filename: 'Solution.java',
        runCmd: ['sh', '-c', 'javac Solution.java && java -cp . Solution'],
        timeout: 15000,
    },
};

/**
 * Execute code in a Docker container sandbox
 * @param {string} code - Source code to execute
 * @param {string} language - Programming language (python|javascript|cpp|java)
 * @param {string} stdin - Standard input for the program
 * @returns {object} { output, error, exitCode, executionTime }
 */
const executeCode = async (code, language, stdin = '') => {
    const startTime = Date.now();

    if (!dockerAvailable) {
        return simulateExecution(code, language, startTime);
    }

    const config = LANGUAGE_CONFIGS[language];
    if (!config) {
        return { output: '', error: `Language '${language}' not supported`, exitCode: 1, executionTime: 0 };
    }

    const docker = new Docker();
    const containerId = `interview-${uuidv4()}`;

    try {
        // Create container with strict security constraints
        const container = await docker.createContainer({
            name: containerId,
            Image: config.image,
            Cmd: config.runCmd,
            AttachStdout: true,
            AttachStderr: true,
            StdinOnce: false,
            NetworkDisabled: true,         // No internet access
            HostConfig: {
                Memory: 64 * 1024 * 1024,   // 64MB memory limit
                MemorySwap: 64 * 1024 * 1024, // No swap
                CpuPeriod: 100000,
                CpuQuota: 50000,             // 50% of one CPU core
                AutoRemove: true,            // Auto-destroy on exit
                ReadonlyRootfs: false,       // Allow writing to /tmp
                SecurityOpt: ['no-new-privileges'], // Prevent privilege escalation
                Tmpfs: { '/tmp': 'rw,noexec,nosuid,size=32m' },
                Ulimits: [
                    { Name: 'nproc', Soft: 64, Hard: 64 }, // Limit processes
                    { Name: 'fsize', Soft: 1024 * 1024, Hard: 1024 * 1024 }, // 1MB file size
                ],
            },
        });

        // Copy code into container
        const tar = require('tar-stream');
        const pack = tar.pack();
        pack.entry({ name: config.filename }, code);
        pack.finalize();

        await container.putArchive(pack, { path: '/app' });
        await container.start();

        // Collect output with timeout
        const outputPromise = new Promise((resolve) => {
            let stdout = '';
            let stderr = '';

            container.attach({ stream: true, stdout: true, stderr: true }, (err, stream) => {
                if (err) { resolve({ stdout: '', stderr: err.message }); return; }

                container.modem.demuxStream(stream, {
                    write: (chunk) => { stdout += chunk.toString(); },
                }, {
                    write: (chunk) => { stderr += chunk.toString(); },
                });

                stream.on('end', () => resolve({ stdout, stderr }));
            });
        });

        // 2-second execution timeout
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Time Limit Exceeded (2s)')), 2000)
        );

        const { stdout, stderr } = await Promise.race([outputPromise, timeoutPromise]);
        const executionTime = Date.now() - startTime;

        // Clean up container if it's still running
        try {
            await container.stop({ t: 0 });
        } catch { } // Already stopped

        return {
            output: stdout.trim(),
            error: stderr.trim(),
            exitCode: stderr ? 1 : 0,
            executionTime,
        };

    } catch (error) {
        const executionTime = Date.now() - startTime;

        // Clean up container on error
        try {
            const docker2 = new Docker();
            const c = docker2.getContainer(containerId);
            await c.remove({ force: true });
        } catch { }

        return {
            output: '',
            error: error.message || 'Execution failed',
            exitCode: 1,
            executionTime,
        };
    }
};

/**
 * Simulated execution for development (when Docker is not available)
 * Returns a mock result for demonstration purposes
 */
const simulateExecution = (code, language, startTime) => {
    const executionTime = Math.floor(Math.random() * 500) + 50;

    // Simple Python print detection for demo
    if (language === 'python') {
        const printMatches = code.match(/print\((.+)\)/g);
        if (printMatches) {
            const output = `[Simulated] Code executed successfully. Contains ${printMatches.length} print statement(s).`;
            return { output, error: '', exitCode: 0, executionTime, simulated: true };
        }
    }

    return {
        output: `[Simulated] ${language} code received and analyzed. Install Docker for actual execution.`,
        error: '',
        exitCode: 0,
        executionTime,
        simulated: true,
    };
};

/**
 * Analyze code patterns locally (without Docker) for complexity estimation
 */
const analyzeCodePatterns = (code) => {
    const patterns = [];

    // Detect nested loops
    const nestedLoopRegex = /for|while/g;
    const loopMatches = code.match(nestedLoopRegex) || [];
    if (loopMatches.length >= 2) patterns.push('nested-loops');

    // Detect recursion (function calling itself - simplified check)
    if (/def\s+(\w+)[^:]+:[\s\S]*?\1\s*\(/.test(code) ||
        /function\s+(\w+)[^{]+{[\s\S]*?\1\s*\(/.test(code)) {
        patterns.push('recursion');
    }

    // Detect sorting
    if (/\.sort\(|sorted\(|Arrays\.sort|Collections\.sort/.test(code)) {
        patterns.push('sorting');
    }

    // Detect hash map usage
    if (/dict\(|{|}|HashMap|unordered_map|Map\(/.test(code)) {
        patterns.push('hash-map');
    }

    return patterns;
};

module.exports = { executeCode, analyzeCodePatterns };
