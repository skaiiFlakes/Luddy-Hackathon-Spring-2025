import requests
from bs4 import BeautifulSoup

def scrape_website(url: str):
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    # Extract data as needed
    data = soup.get_text()  # Example: Extract all text from the page
    return data
