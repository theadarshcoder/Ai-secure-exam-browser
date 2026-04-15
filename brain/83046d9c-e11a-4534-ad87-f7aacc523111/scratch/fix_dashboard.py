import sys

path = r'c:\Users\LENOVO\OneDrive\Desktop\Code Hub\OJT Project\frontend\src\pages\AdminDashboard.jsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Removing lines 1144 to 1154 (1-indexed, so index 1143 to 1153)
# We need to replace them with:
#           </div>
#         </div>

# Verify the lines before deleting
print(f"Line 1144: {repr(lines[1143])}")
print(f"Line 1147: {repr(lines[1146])}")

new_lines = lines[:1143] + ["          </div>\n", "        </div>\n"] + lines[1154:]

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
