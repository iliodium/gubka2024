import os

from catboost import CatBoostRegressor
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
origins = [
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

abspath = os.path.abspath(os.path.dirname(__file__))

models = {
    'Ar_smooth': CatBoostRegressor().load_model(f"{abspath}/models/model_Ar_smooth"),
    'Ar_rough': CatBoostRegressor().load_model(f"{abspath}/models/model_Ar_rough"),
    'He_smooth': CatBoostRegressor().load_model(f"{abspath}/models/model_He_smooth"),
    'He_rough': CatBoostRegressor().load_model(f"{abspath}/models/model_He_rough"),
}


@app.post("/api/v1/predictAtom")
def predict_atom(atoms: dict):
    '''
{
    "atom_info_list":[
      {
          "x":-0.865959130536146,
          "y":-19.561614985421,
          "z":-17.0969643,
          "temperature":296.735163938492,
          "sticking_time":63
      }
    ],
"model": "He"
}

{
    "predicted_atoms":[
    {
        "x":1,
        "y":1,
        "z":1
    }
    ]
}
    '''

    _, atom_type, data_type=atoms["model"].split()
    input_data = [[atom['sticking_time'], atom['temperature'], atom['x'], atom['y'], atom['z']] for atom in
                  atoms["atom_info_list"]]
    predictions = models[f'{atom_type}_{data_type}'].predict(input_data)

    return {
        "predicted_atoms": [
            {
                "x": atom[0],
                "y": atom[1],
                "z": atom[2],
            } for atom in predictions
        ]
    }


@app.get("/api/healthCheck")
def health_check():
    return {"status": "success"}