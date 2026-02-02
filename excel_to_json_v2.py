import pandas as pd
import json
import sys

# Force UTF-8 for stdout if needed, but writing to file is safer
def excel_to_json_file():
    try:
        df = pd.read_excel('jugadores.xlsx')
        
        users = []
        for index, row in df.iterrows():
            user = {}
            for col in df.columns:
                val = str(row[col]).strip()
                if val and val.lower() != 'nan':
                   user[col] = val
            
            # Simple validation: Must have a phone number to be useful
            # The previous attempt might have had keys like "Numero de telefono" vs "Nmero..."
            # Let's clean keys
            clean_user = {}
            for k, v in user.items():
                if "telen" in k.lower() or "fono" in k.lower() or "phone" in k.lower():
                     clean_user["phone"] = v
                elif "nombre" in k.lower() or "name" in k.lower():
                     clean_user["name"] = v
                elif "nivel" in k.lower():
                     clean_user["level"] = v
                elif any(x in k.lower() for x in ["genero", "género", "sexo", "gender"]):
                     gender_val = str(v).lower()
                     if any(x in gender_val for x in ["fem", "chica", "mujer", "f"]):
                         clean_user["gender"] = "chica"
                     else:
                         clean_user["gender"] = "chico"
                else:
                     clean_user[k] = v
            
            if "phone" in clean_user and "name" in clean_user:
                users.append(clean_user)

        with open('final_players.json', 'w', encoding='utf-8') as f:
            json.dump(users, f, ensure_ascii=False, indent=2)
            
        with open('players_data.json', 'w', encoding='utf-8') as f:
            json.dump(users, f, ensure_ascii=False, indent=2)
            
        print(f"Successfully exported {len(users)} players to final_players.json and players_data.json")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    excel_to_json_file()
