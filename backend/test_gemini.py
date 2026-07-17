"""Test Gemini API with both AQ. and AIzaSy key formats."""
import asyncio
import sys

async def test(api_key: str):
    api_key = api_key.strip().strip('"').strip("'")
    if not api_key:
        print("ERROR: No key provided. Pass it as argument: python test_gemini.py YOUR_KEY")
        return

    print(f"Key format: {'AQ. (OAuth2 token)' if api_key.startswith('AQ.') else 'AIzaSy (API key)'}")
    print(f"Key preview: {api_key[:12]}...")

    try:
        from google import genai
        from google.genai import types

        if api_key.startswith("AQ."):
            from google.oauth2.credentials import Credentials
            creds = Credentials(token=api_key)
            client = genai.Client(credentials=creds)
            print("Using OAuth2 credentials mode")
        else:
            client = genai.Client(api_key=api_key)
            print("Using API key mode")

        print("Sending test message...")
        response = await client.aio.models.generate_content(
            model="gemini-2.0-flash",
            contents=[types.Content(role="user", parts=[types.Part(text="Say 'Hello from IntelliDev AI!' and nothing else.")])],
        )
        print(f"\n✅ SUCCESS! Response: {response.text}")

    except Exception as e:
        print(f"\n❌ FAILED: {type(e).__name__}: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_gemini.py YOUR_API_KEY")
        print("Example: python test_gemini.py AQ.Ab8RN...")
        sys.exit(1)
    asyncio.run(test(sys.argv[1]))
