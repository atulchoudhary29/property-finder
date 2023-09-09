from flask import Flask, request, jsonify, send_from_directory, url_for
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app, origins=["https://h6335monmk.execute-api.ap-south-1.amazonaws.com"], methods=["GET", "POST"], allow_headers="*")

# Importing the provided code
# Assuming the code is saved in a file named `real_estate.py`
import real_estate

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

        # Generate file names
        doc_name = 'Undervalued_Properties' if type(zipcode) is str else 'ALL_The_Undervalued_Properties'
        doc_path = f"{doc_name}.docx"
        pdf_path = f"{doc_name}.pdf"
        
        return jsonify({
            'status': 'success',
            'word_path': url_for('download', filename=doc_path, _external=True),
            'pdf_path': url_for('download', filename=pdf_path, _external=True),
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
    return send_from_directory(directory=os.getcwd(), path=filename, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True, port=5000)  # Keep debug as True for development purposes only
