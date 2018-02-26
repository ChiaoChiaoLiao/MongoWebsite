from pymongo import MongoClient
import pandas as pd
import json

URI = "mongodb://<user id>:<password>@<host>"
DB_NAME = 'db_test'
PROCCESSED_DB = 'db_pro'
CLIENT = MongoClient(URI)

def get_collection_list(db):
    col_cursor = db.command('listCollections')
    col_names = []
    for col_name in col_cursor['cursor']['firstBatch']:
        col_names.append(col_name['name'])
    col_names.remove('gfk_total')
    col_names.remove('MD_gfk')
        
    return col_names

def query_countries():
    db = CLIENT[PROCCESSED_DB]
    cursor = db['COUNTRY'].find({}, {'NAME': 1}).sort('NAME')
    countries = []
    for cs in cursor:
        countries.append(cs['NAME'])

    return json.dumps(countries)

def query_quarters():
#    client = MongoClient(URI)
#    gfk_db = client[DB_NAME]
#    collection = gfk_db['gfk_16q2']
#    quarters = get_collection_list(gfk_db)
    quarters = ["15q1", "15q2", "15q3", "15q4"]

    return json.dumps(quarters)

def query_brands():
    db = CLIENT[PROCCESSED_DB]
    cursor = db['BRAND'].find({}, {'NAME': 1}).sort('NAME')
    brands = []
    for cs in cursor:
        brands.append(cs['NAME'])

    return json.dumps(brands)

def query_models(brand):
    brand = brand.replace('and', '&')
    db = CLIENT[PROCCESSED_DB]
    cursor = db['BRAND'].find_one({'NAME': brand}, {'HARDWARE_SPECS': 1})
    models = cursor['HARDWARE_SPECS']
    models.sort()

    return json.dumps(models)

def query_hardware_specs(hash_num):
    db = CLIENT[PROCCESSED_DB]
    specs = db['MODEL'].find_one({'hardware_hash': hash_num})
    specs.pop('_id')

    return json.dumps(specs)

def query_and_operation(collection, sentense):
    pipeline = [{"$match": {'COUNTRY': sentense['country'],
                            'hardware_hash': sentense['model'],
                            'BRAND': sentense['brand']}},
                {"$group": {'_id': {'PERIOD': '$PERIOD',
                                   'SALES VALUE USD': '$SALES VALUE USD',
                                   'SALES UNITS': '$SALES UNITS'}}},
                {"$group": {'_id': '$_id.PERIOD',
                            'TOTAL VALUE': {'$sum': '$_id.SALES VALUE USD'},
                            'TOTAL UNITS': {'$sum': '$_id.SALES UNITS'}}},
                {"$project": {'_id': 0,
                              'PERIOD': '$_id',
                              'TOTAL UNITS': 1,
                              'TOTAL VALUE': 1}},
                {"$sort": {"PERIOD": 1}}]
    cursor = CLIENT[DB_NAME][collection].aggregate(pipeline)
    df = pd.DataFrame(columns=['PERIOD', 'TOTAL UNITS', 'TOTAL VALUE'])
    row = 0
    for record in cursor:
        for key in record.keys():
            df.loc[row,key] = record[key]
        row = row + 1

    return df

def query_sentence(sentense):
    frames = []
    collections = get_collection_list(CLIENT[DB_NAME])
    for co in collections:
        df = query_and_operation(co, sentense)
        frames.append(df)

    results = pd.concat(frames, ignore_index=True)
    results = results.sort_values(by=['PERIOD'])
    json_data = results.to_json(orient='records')

    return json_data