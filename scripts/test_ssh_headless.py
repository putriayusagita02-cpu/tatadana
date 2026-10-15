import subprocess
import time

cmds = [
    ["ssh", "-o", "StrictHostKeyChecking=no", "-o", "BatchMode=yes", "-p", "443", "-R0:localhost:3000", "-T", "a.pinggy.io"],
    ["ssh", "-o", "StrictHostKeyChecking=no", "-o", "BatchMode=yes", "-R", "80:localhost:3000", "-T", "serveo.net"],
    ["ssh", "-o", "StrictHostKeyChecking=no", "-o", "BatchMode=yes", "-R", "80:localhost:3000", "-T", "nokey@localhost.run"]
]

for cmd in cmds:
    print("Testing:", " ".join(cmd))
    try:
        p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        time.sleep(3)
        p.poll()
        if p.returncode is not None:
            print("Exited with", p.returncode, p.stdout.read())
        else:
            # Read first available lines
            import os
            # Set non-blocking or read line
            print("Process is running! Reading output...")
            for _ in range(5):
                line = p.stdout.readline()
                print("OUT:", line.strip())
            p.kill()
            break
    except Exception as e:
        print("Error:", e)
