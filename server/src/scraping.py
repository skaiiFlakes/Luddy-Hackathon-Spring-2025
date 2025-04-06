import cloudscraper
from lxml import html
import json
import time
import re

def extract_role_info(title):
    """Extract role, department, and workflow from title"""
    parts = title.split(' | ')[0].split(', ')
    info = {
        'role': parts[0],
        'department': parts[1] if len(parts) > 1 else '',
        'workflow': parts[2] if len(parts) > 2 else '',
        'location': parts[-1] if len(parts) > 1 else ''
    }
    return info

def clean_text(text):
    """Clean and normalize text"""
    if not text:
        return text
    # Remove extra whitespace
    text = ' '.join(text.split())
    # Remove non-breaking spaces and other special characters
    text = text.replace('\u00a0', ' ').replace('\u2014', '-').replace('\u2019', "'")
    return text

def extract_list_items(elements):
    """Extract list items from li elements"""
    items = []
    for element in elements:
        text = clean_text(element)
        if text and len(text) > 10:  # Ignore very short lines
            items.append(text)
    return items

def scrape_job(url):
    # Create a scraper instance
    scraper = cloudscraper.create_scraper(
        browser={
            'browser': 'chrome',
            'platform': 'windows',
            'mobile': False
        },
        delay=10
    )
    
    try:
        # Get the page
        print(f"Fetching {url}...")
        response = scraper.get(url)
        response.raise_for_status()
        
        # Parse the HTML
        tree = html.fromstring(response.content)
        
        # Initialize the job data structure
        job_data = {
            'role': '',
            'location': '',
            'department': '',
            'workflow': '',
            'company': 'ServiceNow',
            'company_description': '',
            'job_description': '',
            'key_responsibilities': [],
            'basic_qualifications': [],
            'preferred_qualifications': []
        }
        
        # Get and parse the title
        title = tree.xpath('//title/text()')
        if title:
            title_info = extract_role_info(title[0].strip())
            job_data.update(title_info)
        
        # Get company description from p tag under h3
        company_desc = tree.xpath('//h3[contains(text(), "Company Description")]/following-sibling::p[1]//text()')
        if company_desc:
            job_data['company_description'] = clean_text(' '.join(company_desc))
        
        # Get job description from second p tag under Job Description h3
        job_desc = tree.xpath('//h3[contains(text(), "Job Description")]/following-sibling::p[2]//text()')
        if job_desc:
            job_data['job_description'] = clean_text(' '.join(job_desc))
        
        # Get responsibilities from Job Description section
        job_resp = tree.xpath('//h3[contains(text(), "Job Description")]/following-sibling::ul[1]/li//text()')
        if job_resp:
            job_data['key_responsibilities'] = extract_list_items(job_resp)
        
        # Get qualifications - first ul is basic, second ul is preferred
        basic_quals = tree.xpath('//h3[contains(text(), "Qualifications")]/following-sibling::ul[1]/li//text()')
        if basic_quals:
            job_data['basic_qualifications'] = extract_list_items(basic_quals)
        
        preferred_quals = tree.xpath('//h3[contains(text(), "Qualifications")]/following-sibling::ul[2]/li//text()')
        if preferred_quals:
            job_data['preferred_qualifications'] = extract_list_items(preferred_quals)
        
        return job_data

    except Exception as e:
        print(f"Error: {e}")
        return {"error": str(e)}

def save_to_json(data, filename):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    print(f"Data saved to {filename}")

if __name__ == "__main__":
    url = "https://careers.servicenow.com/jobs/744000052094688/sr-manager-product-design-crm-industry-workflows/"
    job_data = scrape_job(url)
    save_to_json(job_data, "job_data.json") 