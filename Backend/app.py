from flask import Flask, request, jsonify, send_from_directory, url_for
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for the Flask app

# Importing the provided code
# Assuming the code is saved in a file named `real_estate.py`
import real_estate
SAVE_DIRECTORY = "/tmp"
URL_PREFIX = "https://po4w9kv2x0.execute-api.ap-south-1.amazonaws.com"

@app.route('/process-data', methods=['POST'])
def process_data():
    try:
        # Extracting data from the request
        data = request.json
        num_homes = data['num_homes']
        user_input = data['uipt']
        app.logger.info(user_input)  # Use Flask's logger
        region_id = data['region_id']

        # Call the main function
        zipcode, table_data = real_estate.main(num_homes, user_input, region_id)

        # Generate file names without the /tmp/ prefix for the URL
        doc_name = 'Undervalued_Properties' if type(zipcode) is str else 'ALL_The_Undervalued_Properties'
        doc_filename = f"{doc_name}.docx"
        pdf_filename = f"{doc_name}.pdf"
    
        # Use the URL_PREFIX and the filename without the directory to generate the URL
        word_path = f"{URL_PREFIX}/download/{doc_filename}"
        pdf_path = f"{URL_PREFIX}/download/{pdf_filename}"

    return jsonify({
        'status': 'success',
        'word_path': word_path,
        'pdf_path': pdf_path,
        'table_data': table_data
    })
    except Exception as e:
        app.logger.error(f"Error processing data: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/download/<path:filename>', methods=['GET'])
def download(filename):
    """Serve files for download."""
    return send_from_directory(directory=SAVE_DIRECTORY, path=filename, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True, port=5000)  # Keep debug as True for development purposes only
