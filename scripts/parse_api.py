import json

with open('/home/z/my-project/upload/api-docs.json', 'r') as f:
    data = json.load(f)

print("=== API INFO ===")
print(f"Title: {data['info']['title']}")
print(f"Version: {data['info']['version']}")
print(f"Server: {data['servers'][0]['url']}")

print("\n=== PATHS ===")
for path, methods in data['paths'].items():
    for method, details in methods.items():
        if method in ['get', 'post', 'put', 'delete', 'patch']:
            tags = details.get('tags', [])
            op_id = details.get('operationId', 'N/A')
            params = details.get('parameters', [])
            has_body = 'requestBody' in details
            print(f"  {method.upper():6} {path:40} [{', '.join(tags)}] id={op_id} params={len(params)} body={has_body}")

print("\n=== SCHEMAS ===")
for name, schema in data.get('components', {}).get('schemas', {}).items():
    props = list(schema.get('properties', {}).keys())
    print(f"  {name}: {props}")

print("\n=== SECURITY ===")
print(json.dumps(data.get('components', {}).get('securitySchemes', {}), indent=2))

print("\n=== GLOBAL SECURITY ===")
print(json.dumps(data.get('security', []), indent=2))
