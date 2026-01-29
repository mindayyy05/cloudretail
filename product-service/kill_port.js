const { exec } = require('child_process');

exec('lsof -t -i:4002', (err, stdout) => {
    if (stdout) {
        const pid = stdout.trim();
        console.log(`Killing PID ${pid}`);
        exec(`kill -9 ${pid}`);
    }
});
