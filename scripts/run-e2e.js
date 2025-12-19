const { spawn } = require('child_process');

if (process.env.E2E_RUN !== 'true') {
  console.log('E2E_RUN não está definido como "true"; testes E2E pulados.');
  process.exit(0);
}

const child = spawn('npx', ['playwright', 'test'], {
  stdio: 'inherit',
  shell: true,
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});
