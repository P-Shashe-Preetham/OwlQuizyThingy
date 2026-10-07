import re

with open("packages/socket/src/__tests__/contract.test.ts", "r") as f:
    content = f.read()

resolved_content = re.sub(
    r'<<<<<<< HEAD\n\n=======\n>>>>>>> origin/main\n',
    r'\n',
    content,
    flags=re.DOTALL
)

resolved_content = re.sub(
    r'<<<<<<< HEAD\n    const invalidLogin = { gameId: "game123", data: { username: "" } } \n  \/\/\n=======\n    const invalidLogin = { gameId: "game123", data: { username: "" } }\n>>>>>>> origin/main',
    r'    const invalidLogin = { gameId: "game123", data: { username: "" } }',
    resolved_content,
    flags=re.DOTALL
)

with open("packages/socket/src/__tests__/contract.test.ts", "w") as f:
    f.write(resolved_content)

print("contract.test.ts conflict resolved")
