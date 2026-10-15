import subprocess
import sys

try:
    res = subprocess.run(
        ["ssh", "-o", "StrictHostKeyChecking=no", "-p", "443", "-R0:localhost:3000", "a.pinggy.io"],
        capture_output=True,
        text=True,
        timeout=10
    )
    print("STDOUT:", res.stdout)
    print("STDERR:", res.stderr)
except subprocess.TimeoutExpired as e:
    print("TIMEOUT!")
    if e.stdout: print("stdout:", e.stdout)
    if e.stderr: print("stderr:", e.stderr)
except Exception as e:
    print("ERROR:", e)
