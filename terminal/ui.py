# ui.py
import os
from tabulate import tabulate

def clear_screen():
    """Clears the terminal screen."""
    os.system('cls' if os.name == 'nt' else 'clear')

def print_banner():
    """Prints the ASCII art banner."""
    banner = """
  _      _______ ____     __      __  _     _      _       __  __                                   
 | |    |__   __/ __ \    \ \    / / | |   (_)    | |     |  \/  |                                  
 | |       | | | |  | |    \ \  / /__| |__  _  ___| | ___ | \  / | __ _ _ __   __ _  __ _  ___ _ __ 
 | |       | | | |  | |     \ \/ / _ \ '_ \| |/ __| |/ _ \| |\/| |/ _` | '_ \ / _` |/ _` |/ _ \ '__|
 | |____   | | | |__| |      \  /  __/ | | | | (__| |  __/| |  | | (_| | | | | (_| | (_| |  __/ |   
 |______|  |_|  \____/        \/ \___|_| |_|_|\___|_|\___||_|  |_|\__,_|_| |_|\__,_|\__, |\___|_|   
                                                                                     __/ |          
                                                                                    |___/           
    """
    print(banner)
    print("=" * 100)

def print_menu():
    """Prints the main navigation menu."""
    print("\nMAIN MENU:")
    print("  [1] View All Registered Drivers")
    print("  [2] Search Vehicles by Driver License")
    print("  [3] View Expired Vehicle Registrations")
    print("  [4] View Suspended/Expired Licenses")
    print("  [5] Exit Application")
    print("=" * 100)

def display_table(rows, headers, title):
    """Formats and prints data in an ASCII table."""
    clear_screen()
    print_banner()
    print(f"\n--- {title.upper()} ---\n")
    
    if not rows:
        print("[!] No records found.\n")
    else:
        print(tabulate(rows, headers=headers, tablefmt="grid"))
    
    input("\nPress Enter to return to the main menu...")