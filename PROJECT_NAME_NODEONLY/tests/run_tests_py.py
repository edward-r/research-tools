# tests/run_tests_py.py
import json, subprocess, sys
def run_py():
    p = subprocess.Popen(["python3","assets/code_py/sample_llm_primitives.py"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    out, err = p.communicate(); return p.returncode, out, err
def approx(a,b,eps=1e-9): return abs(a-b) <= eps
def main():
    code,out,err = run_py()
    if code != 0: print("❌ Python demo exited non-zero"); print(err); sys.exit(1)
    try: j = json.loads(out)
    except Exception as e: print("❌ Output not JSON:", e); print(out); sys.exit(1)
    if not approx(j.get("sum_probs", 0.0), 1.0): print("❌ softmax probs != 1.0"); sys.exit(1)
    print("✅ Python tests passed"); sys.exit(0)
if __name__ == "__main__": main()
