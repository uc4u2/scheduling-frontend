import requests
payload = {
    'candidate_name': 'Test User',
    'candidate_email': 'test@example.com',
    'candidate_phone': '1234567890',
    'candidate_position': 'Teacher',
    'availability_id': 1
}
try:
    resp = requests.post('http://localhost:5000/api/candidate-forms/intake/testtoken/book-slot', data=payload)
    print(resp.status_code)
    print(resp.text[:200])
except Exception as exc:
    print('request error:', exc)
