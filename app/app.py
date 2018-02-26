import MongoQuery
from flask import Flask, request

app = Flask(__name__)

@app.route('/query/<path:path>', methods=['GET'])
def query_condition(path):
    print(path)
    if path == 'countries':
        return MongoQuery.query_countries()
    elif path == 'quarters':
        return MongoQuery.query_quarters()
    elif path == 'brands':
        return MongoQuery.query_brands()
    elif path == 'models':
        return MongoQuery.query_models(request.args.get('brand', '').replace('and', '&'))
    elif path == 'specs':
        return MongoQuery.query_hardware_specs(request.args.get('model', ''))
    
    variables = {}
    variables['country'] = request.args.get('country', '')
    variables['brand'] = request.args.get('brand', '').replace('and', '&')
    variables['model'] = request.args.get('model', '')
    return query_mongo(variables)
    
def query_mongo(variables):
    print(variables)
    data = MongoQuery.query_sentence(variables)

    return data

@app.after_request
def add_header(r):
    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also to cache the rendered page for 10 minutes.
    """
    r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    r.headers["Pragma"] = "no-cache"
    r.headers["Expires"] = "0"
    r.headers['Cache-Control'] = 'public, max-age=0'
    r.headers['Access-Control-Allow-Origin'] = '*'
    return r

if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True, port=5002)

