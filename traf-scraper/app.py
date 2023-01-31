from flask import Flask, jsonify, request, abort
from flask_cors import CORS
import trafilatura
from youtube_transcript_api import YouTubeTranscriptApi
import web_parser

app = Flask(__name__)
CORS(app)

@app.route('/')
def main():
    return abort(404)


@app.route('/scrape', methods=['POST'])
def scrape():
    try:
        data = request.get_json()
        url = data['url']
        print('scraping url: ' + url)
        content = scrapeContent(url)
        # print(content)
        return jsonify(content)
    except Exception as e:
        print(e)
        return jsonify({'error': 'Unknown error in scrape'})

@app.route('/yscrape', methods=['POST'])
def yscrape():
    try:
        data = request.get_json()
        video_id = data['video_id']
        print('scraping ytube: ' + video_id)
        return {'result': YouTubeTranscriptApi.get_transcript(video_id)}
    except Exception as e:
        print(e)
        return {'error': 'Unknown error in scrapeContent'}


def scrapeContent(url):
    try:
        downloaded = trafilatura.fetch_url(url)
        soup = web_parser.get_soup(downloaded)
        og_metadata = web_parser.get_og_all(soup)
        content = trafilatura.extract(downloaded)
        if content is None or len(content) == 0:
            return {'error': 'The provided page has no content'}
        return {'content': content, 'og': og_metadata}
    except Exception as e:
        print(e)
        return {'error': 'Unknown error in scrapeContent'}