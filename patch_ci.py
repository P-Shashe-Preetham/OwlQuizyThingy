import re

with open(".github/workflows/ci.yml", "r") as f:
    content = f.read()

# Replace the entire conflict block with the contents from HEAD (the testing steps we want)
# and adjust the "needs" array for the build step appropriately.
resolved_content = re.sub(
    r'<<<<<<< HEAD\n(.*?)\n=======\n>>>>>>> origin/main\n  build:\n    needs: e2e-and-accessibility',
    r'\1\n  build:\n    needs: contract',
    content,
    flags=re.DOTALL
)

with open(".github/workflows/ci.yml", "w") as f:
    f.write(resolved_content)

print("ci.yml conflict resolved")
