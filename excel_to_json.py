import pandas as pd
import json

def excel_to_json():
    try:
        # Load the Excel file
        df = pd.read_excel('jugadores.xlsx')
        
        # Convert to list of dictionaries
        # Assuming columns might be like 'Nombre', 'Telefono', 'Nivel', etc.
        # We'll inspect the columns first or just dump it to let the JS handle mapping if needed
        # But for better result, let's normalize here.
        
        users = []
        for index, row in df.iterrows():
            # Basic normalization (adjust column names based on what we find or assume)
            # We'll try to find columns that look like Name and Phone
            
            user = {}
            for col in df.columns:
                val = str(row[col]).strip()
                if val and val != 'nan':
                    user[col] = val
            users.append(user)
            
        print(json.dumps(users, ensure_ascii=False, indent=2))
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    excel_to_json()
