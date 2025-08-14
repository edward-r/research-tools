# assets/code_py/sample_llm_primitives.py
import json, math, sys
def softmax(xs):
    m = max(xs) if xs else 0.0
    ex = [math.exp(x - m) for x in xs]
    s = sum(ex)
    return [e / s for e in ex] if s else [0.0 for _ in xs]
def cross_entropy(probs, target_index):
    eps = 1e-12
    p = max(min(probs[target_index], 1.0 - eps), eps)
    return -math.log(p)
def main():
    logits = [1.2, -0.3, 0.7]; target = 0
    probs = softmax(logits); loss = cross_entropy(probs, target)
    print(json.dumps({"probs":[round(p,6) for p in probs], "loss":round(loss,6), "sum_probs":round(sum(probs),6)}, indent=2))
if __name__ == "__main__":
    try: main()
    except Exception as e:
        sys.stderr.write(str(e)+"\n"); sys.exit(1)
