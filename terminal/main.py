# main.py
import sys
from config import DB_CONFIG
from database import Database
import ui

def main():
    db = Database(DB_CONFIG)
    
    if not db.connect():
        sys.exit(1)

    while True:
        ui.clear_screen()
        ui.print_banner()
        ui.print_menu()
        
        choice = input("Enter your choice (1-5): ").strip()

        if choice == '1':
            # View all drivers (Basic overview)
            query = """
                SELECT license_no, fname, lname, sex, license_type, license_status 
                FROM driver;
            """
            rows, headers = db.fetch_data(query)
            ui.display_table(rows, headers, "All Registered Drivers")

        elif choice == '2':
            # Search Vehicles by Driver License
            license_no = input("\nEnter Driver License No (e.g., P02-22-654321): ").strip()
            query = """
                SELECT v.plate_no, v.make, v.model, v.year, v.vehicle_type, v.color
                FROM vehicle v
                WHERE v.license_no = %s;
            """
            rows, headers = db.fetch_data(query, (license_no,))
            ui.display_table(rows, headers, f"Vehicles Owned by {license_no}")

        elif choice == '3':
            # View Expired Vehicle Registrations
            query = """
                SELECT r.registration_no, r.plate_no, v.make, v.model, r.expiration_date
                FROM vehicle_registration r
                JOIN vehicle v ON r.plate_no = v.plate_no
                WHERE r.expiration_date < CURDATE();
            """
            rows, headers = db.fetch_data(query)
            ui.display_table(rows, headers, "Expired Vehicle Registrations")

        elif choice == '4':
            # View Suspended/Expired Licenses
            query = """
                SELECT license_no, fname, lname, license_type, license_status, expiry_date
                FROM driver
                WHERE license_status IN ('Expired', 'Suspended');
            """
            rows, headers = db.fetch_data(query)
            ui.display_table(rows, headers, "Suspended or Expired Driver Licenses")

        elif choice == '5':
            print("\nDisconnecting from database...")
            db.disconnect()
            print("Goodbye!")
            break
            
        else:
            print("\n[!] Invalid choice. Please try again.")
            input("Press Enter to continue...")

if __name__ == "__main__":
    main()