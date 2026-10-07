import urllib.request
import json

def run_tests():
    print("Running API E2E Check...")
    try:
        # 1. Health check
        res = urllib.request.urlopen('http://localhost:8000/api/v1/health')
        assert res.getcode() == 200
        print("[OK] Health check passed")

        # 2. Auth demo session
        req = urllib.request.Request('http://localhost:3000/api/proxy/auth/demo', method='POST')
        res = urllib.request.urlopen(req)
        cookie = res.getheader('Set-Cookie')
        assert cookie is not None
        print("[OK] Auth demo session passed")

        # 3. Create form
        req = urllib.request.Request(
            'http://localhost:3000/api/proxy/forms',
            headers={'Content-Type': 'application/json', 'Cookie': cookie},
            method='POST',
            data=json.dumps({'title': 'E2E Test Form'}).encode()
        )
        res = urllib.request.urlopen(req)
        form = json.loads(res.read().decode())
        form_id = form['id']
        assert form_id is not None
        print("[OK] Form creation passed")

        # 4. Add question
        req = urllib.request.Request(
            f'http://localhost:3000/api/proxy/forms/{form_id}/questions',
            headers={'Content-Type': 'application/json', 'Cookie': cookie},
            method='POST',
            data=json.dumps({'type': 'text'}).encode()
        )
        res = urllib.request.urlopen(req)
        q = json.loads(res.read().decode())
        assert q['id'] is not None
        print("[OK] Add question passed")

        # 5. Publish form
        req = urllib.request.Request(
            f'http://localhost:3000/api/proxy/forms/{form_id}/publish',
            headers={'Cookie': cookie},
            method='POST'
        )
        res = urllib.request.urlopen(req)
        form = json.loads(res.read().decode())
        slug = form['slug']
        assert slug is not None
        print("[OK] Form publish passed")

        print("\nAll E2E checks passed successfully!")
    except Exception as e:
        print(f"[FAIL] E2E Check Failed: {e}")
        if hasattr(e, 'read'):
            print(e.read().decode())

if __name__ == "__main__":
    run_tests()
