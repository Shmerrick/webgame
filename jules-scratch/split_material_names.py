import json, copy, re

with open('public/materials.json') as f:
    data = json.load(f)

def sanitize(text):
    return re.sub(r'[^A-Za-z0-9]+', '_', text).strip('_')

def split_name(mat):
    name = mat['name']
    if '/' not in name:
        return [mat]
    results = []
    # Case where slash inside parentheses
    m = re.match(r'^(.*)\(([^)]*)\)(.*)$', name)
    if m and '/' in m.group(2):
        pre, inner, post = m.groups()
        parts = [p.strip() for p in inner.split('/')]
        for part in parts:
            new_mat = copy.deepcopy(mat)
            new_name = f"{pre}({part}){post}"
            new_mat['name'] = new_name
            new_mat['rowName'] = f"{mat['rowName']}_{sanitize(part)}"
            results.append(new_mat)
        return results
    # General case
    parts = [p.strip() for p in name.split('/')]
    suffix = ''
    last = parts[-1]
    if ' ' in last and ' ' not in parts[0]:
        idx = last.index(' ')
        suffix = last[idx:]
        parts[-1] = last[:idx]
    for part in parts:
        new_mat = copy.deepcopy(mat)
        new_name = part + suffix if suffix and ' ' not in part else part
        new_mat['name'] = new_name
        new_mat['rowName'] = f"{mat['rowName']}_{sanitize(new_name)}"
        results.append(new_mat)
    return results

for category in list(data.keys()):
    for tier in list(data[category].keys()):
        new_list = []
        for mat in data[category][tier]:
            new_list.extend(split_name(mat))
        data[category][tier] = new_list

with open('public/materials.json', 'w') as f:
    json.dump(data, f, indent=2)
