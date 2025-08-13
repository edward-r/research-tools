# assets/code_py/sample_llm_primitives.py
# Pure-Python (no deps) demo: tokenizer, softmax, cross-entropy on toy logits.
# Prints JSON so it integrates with the existing logging pipeline.

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

def tokenize(text):
    # naive whitespace tokenizer
    return text.strip().split()

def forward(logits, target_index):
    probs = softmax(logits)
    loss = cross_entropy(probs, target_index)
    return probs, loss

def main():
    # toy example
    vocab = tokenize("hello world hello LLM")
    logits = [1.2, -0.3, 0.7]  # pretend model outputs for 3 classes
    target = 0  # index of correct class
    probs, loss = forward(logits, target)
    out = {
        "vocab_size": len(set(vocab)),
        "probs": [round(p, 6) for p in probs],
        "loss": round(loss, 6),
        "sum_probs": round(sum(probs), 6)
    }
    print(json.dumps(out, indent=2))

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        sys.stderr.write(str(e) + "\n")
        sys.exit(1)
