import subprocess

cmd = ["ssh", "-o", "StrictHostKeyChecking=no", "-o", "ServerAliveInterval=30", "-R", "80:localhost:3000", "nokey@localhost.run"]
p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)

for i in range(70):
    line = p.stdout.readline()
    if not line:
        break
    clean = line.strip()
    if clean:
        print(f"L{i}: {clean}")
p.kill()
