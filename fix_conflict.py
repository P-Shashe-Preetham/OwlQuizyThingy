import sys

content = sys.stdin.read()

# Fix conflict 1
content = content.replace("<<<<<<< HEAD\n\n=======\n>>>>>>> origin/main\n", "")
# Fix conflict 2
content = content.replace("<<<<<<< HEAD\n    // Username too short\n=======\n>>>>>>> origin/main\n", "    // Username too short\n")
# Fix conflict 3
content = content.replace("<<<<<<< HEAD\n    // E.g. simulating a user sending manager events without a token\n\n=======\n>>>>>>> origin/main\n", "    // E.g. simulating a user sending manager events without a token\n")

with open("packages/socket/src/__tests__/contract.test.ts", "w") as f:
    f.write(content)
