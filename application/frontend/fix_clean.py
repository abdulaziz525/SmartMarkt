with open('dashboard_code_clean.txt', 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "TAB: POS SALES SCREEN" in line:
        break
    new_lines.append(line)

# Wait, the line before that was `{/* ========================================================`
# Let's just find the index of `{/* ========================================================` and remove it and everything after it.
# Actually let's just do a string search on the joined text.
text = "".join(lines)
end_marker = "{/* ========================================================\n              TAB: POS SALES SCREEN"
if end_marker in text:
    text = text[:text.find(end_marker)]

with open('dashboard_code_clean.txt', 'w') as f:
    f.write(text)

print("Fixed dashboard_code_clean.txt")
