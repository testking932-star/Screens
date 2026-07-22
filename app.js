/* ==========================================================================
   DYNAMIC CLOVER MENU DISPLAY - CORE ENGINE
   ========================================================================== */

// 1. STATE & CONFIGURATION MANAGEMENT
const DEFAULT_CONFIG = {
    mode: 'live', // 'demo' or 'live'
    merchantId: '', // Merchant ID is securely hidden server-side inside worker proxy
    accessToken: '', // Token is securely injected server-side by worker proxy
    environment: 'prod', // 'prod' or 'sandbox'
    autoTags: true,
    refreshInterval: 10, // seconds (minimum 5s to respect Clover API rate limits)
    orientation: 'portrait', // 'portrait', 'landscape', 'rotate90', 'rotate270'
    screenRatio: '9-16', // 'auto', '16-9', '4-3', '21-9', '9-16'
    hiddenCategories: [], // Category names toggled off from all TV screens
    mappings: {
        screen1: 'Appetizer (Veg)',
        screen2: 'Appetizer (Veg)',
        screen3: 'Beverages',
        screen4: 'Biryanis/Pulao (Non-Veg)'
    }
};

let config = { ...DEFAULT_CONFIG };
let inventoryData = [];
let cloverTags = {}; // { 'hidden-tv': 'TAG_ID', 'blur-tv': 'TAG_ID' }
let refreshTimer = null;
let adminSearchQuery = ''; // Search query for the admin item list
let extraScreenCount = 0;  // Number of extra screens added beyond screen1-screen4

// Mock Data for Demo Mode
const DEMO_INVENTORY = [
    {
        "id": "4ZQ982FYG0FMW",
        "name": "Crispy French Fries",
        "description": "",
        "price": 599,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-evening-snacks",
                    "name": "Evening Snacks"
                }
            ]
        }
    },
    {
        "id": "D5MY2EJJ8QARG",
        "name": "Kona Seema Fry Piece Chicken Pulao",
        "description": "",
        "price": 1499,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "5B0X4Y74MVJDG",
        "name": "Tandoori Chicken Mandi(2PC)",
        "description": "",
        "price": 2799,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "R6EK80R88TCNE",
        "name": "Extra Juicy Mandi Piece(chicken)",
        "description": "",
        "price": 799,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-extras-add-on's",
                    "name": "Extras Add On's"
                }
            ]
        }
    },
    {
        "id": "YHD1R8XQ3WHQM",
        "name": "Shrimp Mandi",
        "description": "",
        "price": 1999,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "PR3PANQH9TQKJ",
        "name": "Tandoori Chicken Mandi(1pc)",
        "description": "",
        "price": 1699,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "23C9E084JDW9E",
        "name": "Veg Dum Biryani",
        "description": "",
        "price": 999,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(veg)",
                    "name": "Biryanis/Pulao (Veg)"
                }
            ]
        }
    },
    {
        "id": "VQ2NFJ67S7ANY",
        "name": "Mysore Bonda",
        "description": "",
        "price": 699,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-breakfast/tiffins/dosa",
                    "name": "Breakfast/Tiffins/Dosa"
                }
            ]
        }
    },
    {
        "id": "C6AZ4E3XK78HW",
        "name": "Mutton Ghee Roast Mandi",
        "description": "",
        "price": 2399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "26P3VNRT43N9Y",
        "name": "Juicy Chicken Mandi (2pc)",
        "description": "",
        "price": 2999,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "1FWYVNH699VDM",
        "name": "Juicy Chicken Mandi (1pc)",
        "description": "",
        "price": 1799,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "PZMYXCK7YG0QR",
        "name": "Fry Piece Chicken Mandi(2 Pc)",
        "description": "",
        "price": 2799,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "PKRBKMJ9CAYVA",
        "name": "Fry Piece Chicken Mandi(1PC)",
        "description": "",
        "price": 1699,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "B335FD45HD4BP",
        "name": "Vijayawada Special Chicken Pulao",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-pulao",
                    "name": "Pulao"
                },
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "DVQNPJAMTVRGJ",
        "name": "Kona Seema Fry Piece Chicken Biryani",
        "description": "",
        "price": 1499,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "5C20KQZFAHDXW",
        "name": "Gongura Goat Curry",
        "description": "",
        "price": 1899,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(non-veg)",
                    "name": "Curries (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "2RRZ1QADKC618",
        "name": "Mutton Ghee Roast Pulao",
        "description": "",
        "price": 1899,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-pulao",
                    "name": "Pulao"
                },
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "CFKSKNVFNVT9T",
        "name": "Fry Piece Chicken Pulao",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-pulao",
                    "name": "Pulao"
                },
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "WF7D9KPMJND58",
        "name": "Gongura Chicken Pulao",
        "description": "",
        "price": 1499,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-pulao",
                    "name": "Pulao"
                },
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "ZFMP1E890KYYE",
        "name": "Kushi Spl Boneless Chicken Pulao",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-pulao",
                    "name": "Pulao"
                },
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "ZYNVT7CWGFNN6",
        "name": "Gobi 65 Pulao",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-pulao",
                    "name": "Pulao"
                },
                {
                    "id": "cat-biryanis/pulao-(veg)",
                    "name": "Biryanis/Pulao (Veg)"
                }
            ]
        }
    },
    {
        "id": "7KXEGF9TF1FAC",
        "name": "Curry Leaf Gobi",
        "description": "",
        "price": 1299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(veg)",
                    "name": "Appetizer (Veg)"
                }
            ]
        }
    },
    {
        "id": "N11756D4RSVXM",
        "name": "Gobi 65 Biryani",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(veg)",
                    "name": "Biryanis/Pulao (Veg)"
                }
            ]
        }
    },
    {
        "id": "BH63GTWMR01Z6",
        "name": "Gongura Paneer Pulao",
        "description": "",
        "price": 1499,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-pulao",
                    "name": "Pulao"
                },
                {
                    "id": "cat-biryanis/pulao-(veg)",
                    "name": "Biryanis/Pulao (Veg)"
                }
            ]
        }
    },
    {
        "id": "35JZ4C8NH5BF6",
        "name": "Ulavacharu Veg Pulao",
        "description": "",
        "price": 1499,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-pulao",
                    "name": "Pulao"
                },
                {
                    "id": "cat-biryanis/pulao-(veg)",
                    "name": "Biryanis/Pulao (Veg)"
                }
            ]
        }
    },
    {
        "id": "6JNYYC2K2E13J",
        "name": "Gutti Vankaya Pulao",
        "description": "",
        "price": 1499,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-pulao",
                    "name": "Pulao"
                },
                {
                    "id": "cat-biryanis/pulao-(veg)",
                    "name": "Biryanis/Pulao (Veg)"
                }
            ]
        }
    },
    {
        "id": "ZNHP7YDW1SR6P",
        "name": "Kaju Paneer Pulao",
        "description": "",
        "price": 1499,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-pulao",
                    "name": "Pulao"
                },
                {
                    "id": "cat-biryanis/pulao-(veg)",
                    "name": "Biryanis/Pulao (Veg)"
                }
            ]
        }
    },
    {
        "id": "8CP3X3ZPPEAKC",
        "name": "Kaju Paneer Biryani",
        "description": "",
        "price": 1499,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(veg)",
                    "name": "Biryanis/Pulao (Veg)"
                }
            ]
        }
    },
    {
        "id": "M06EMG32DVT84",
        "name": "Mixed Veg Curry",
        "description": "",
        "price": 1299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(veg)",
                    "name": "Curries (Veg)"
                }
            ]
        }
    },
    {
        "id": "Z7MJWM8AE842Y",
        "name": "Chilli Paneer (wet)",
        "description": "",
        "price": 1299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(veg)",
                    "name": "Appetizer (Veg)"
                }
            ]
        }
    },
    {
        "id": "2HRGXG29Q5GCR",
        "name": "Ghee Karapodi Dosa",
        "description": "",
        "price": 1049,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-breakfast/tiffins/dosa",
                    "name": "Breakfast/Tiffins/Dosa"
                }
            ]
        }
    },
    {
        "id": "4BCXBZGFKMKC8",
        "name": "Vijayawada Special Chicken Biryani",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "J57TVFBPHE0K2",
        "name": "Ulavacharu Veg Biryani",
        "description": "",
        "price": 1499,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(veg)",
                    "name": "Biryanis/Pulao (Veg)"
                }
            ]
        }
    },
    {
        "id": "R7Z13THJEVZG2",
        "name": "Ulavacharu Goat Biryani",
        "description": "",
        "price": 1899,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "7HBRBB8KRN200",
        "name": "Ulavacharu Chicken Biryani",
        "description": "",
        "price": 1499,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "V1VZSJ5X4THA6",
        "name": "Rava Dosa With Masala",
        "description": "",
        "price": 1299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-breakfast/tiffins/dosa",
                    "name": "Breakfast/Tiffins/Dosa"
                }
            ]
        }
    },
    {
        "id": "S48F9NQBWR2FC",
        "name": "Gongura Goat Biryani",
        "description": "",
        "price": 1899,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "ZBAA3ZJA3DWAC",
        "name": "Minute Maid Lemonade",
        "description": "",
        "price": 169,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-beverages",
                    "name": "Beverages"
                }
            ]
        }
    },
    {
        "id": "TX683D0BYASY4",
        "name": "Pepsi",
        "description": "",
        "price": 149,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-beverages",
                    "name": "Beverages"
                }
            ]
        }
    },
    {
        "id": "NVK9SF71TBG8E",
        "name": "Rava Dosa (Onion + Chilli)",
        "description": "",
        "price": 1199,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-breakfast/tiffins/dosa",
                    "name": "Breakfast/Tiffins/Dosa"
                }
            ]
        }
    },
    {
        "id": "XB8DVJ3G9D5GC",
        "name": "Combo 3: Idli(2 Pcs)+ Vada(2 Pcs)+ Mini Dosa(1)",
        "description": "",
        "price": 1299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-breakfast/tiffins/dosa",
                    "name": "Breakfast/Tiffins/Dosa"
                }
            ]
        }
    },
    {
        "id": "571CSF9GWXMRT",
        "name": "Gongura Paneer Biryani",
        "description": "",
        "price": 1499,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(veg)",
                    "name": "Biryanis/Pulao (Veg)"
                }
            ]
        }
    },
    {
        "id": "CGJ27Y89YQT14",
        "name": "Gongura Veg Biryani",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(veg)",
                    "name": "Biryanis/Pulao (Veg)"
                }
            ]
        }
    },
    {
        "id": "BCBNE8GWQ73ZA",
        "name": "Ghee Sambar Idli (2 Pieces)",
        "description": "",
        "price": 699,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-breakfast/tiffins/dosa",
                    "name": "Breakfast/Tiffins/Dosa"
                }
            ]
        }
    },
    {
        "id": "08SCDVJ88GNB4",
        "name": "Ghee Karam Idli(3 Pcs)",
        "description": "",
        "price": 699,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-breakfast/tiffins/dosa",
                    "name": "Breakfast/Tiffins/Dosa"
                }
            ]
        }
    },
    {
        "id": "FN1V3YXM6NSJ6",
        "name": "Limca",
        "description": "",
        "price": 199,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-beverages",
                    "name": "Beverages"
                }
            ]
        }
    },
    {
        "id": "FW1W7KCAD2V6W",
        "name": "Combo 1 : Idli (3 pcs) + Vada (2 pcs)",
        "description": "",
        "price": 999,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-breakfast/tiffins/dosa",
                    "name": "Breakfast/Tiffins/Dosa"
                }
            ]
        }
    },
    {
        "id": "HNFCNAEFY8NGE",
        "name": "Pesarattu (Onion + Chilis)",
        "description": "",
        "price": 999,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-breakfast/tiffins/dosa",
                    "name": "Breakfast/Tiffins/Dosa"
                }
            ]
        }
    },
    {
        "id": "VQT60G8HXM7KA",
        "name": "Poori (3Pcs)",
        "description": "",
        "price": 799,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-breakfast/tiffins/dosa",
                    "name": "Breakfast/Tiffins/Dosa"
                }
            ]
        }
    },
    {
        "id": "2G901NMB2GPPP",
        "name": "Pesarattu (Plain)",
        "description": "",
        "price": 899,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-breakfast/tiffins/dosa",
                    "name": "Breakfast/Tiffins/Dosa"
                }
            ]
        }
    },
    {
        "id": "1HQKT04G37VM8",
        "name": "Chole Bhature (1 pc)",
        "description": "",
        "price": 899,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-breakfast/tiffins/dosa",
                    "name": "Breakfast/Tiffins/Dosa"
                }
            ]
        }
    },
    {
        "id": "8C0PJGZZ67TF4",
        "name": "Chicken Manchuria",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(non-veg)",
                    "name": "Appetizer (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "ZE4G77VASQB6Y",
        "name": "Kadai Veg Curry",
        "description": "",
        "price": 1299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(veg)",
                    "name": "Curries (Veg)"
                }
            ]
        }
    },
    {
        "id": "V1SMRCBPY9Z8E",
        "name": "Irani Chai (6 Oz)",
        "description": "",
        "price": 199,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-beverages",
                    "name": "Beverages"
                }
            ]
        }
    },
    {
        "id": "43PGDJNPCBFSC",
        "name": "Paneer Pulao",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-pulao",
                    "name": "Pulao"
                },
                {
                    "id": "cat-biryanis/pulao-(veg)",
                    "name": "Biryanis/Pulao (Veg)"
                }
            ]
        }
    },
    {
        "id": "1ANJ6FT7MZPQP",
        "name": "Rose Milk",
        "description": "",
        "price": 299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-beverages",
                    "name": "Beverages"
                }
            ]
        }
    },
    {
        "id": "GBGBT5TZ79WZM",
        "name": "Goat Pulao",
        "description": "",
        "price": 1799,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-pulao",
                    "name": "Pulao"
                },
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "F3651J3EJT76Y",
        "name": "Chicken Pulao",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-pulao",
                    "name": "Pulao"
                },
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "Y67D9BP69M8RA",
        "name": "Kadai Goat",
        "description": "",
        "price": 1699,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(non-veg)",
                    "name": "Curries (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "HT9J565MGHS3J",
        "name": "Kadai Shrimp",
        "description": "",
        "price": 1599,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(non-veg)",
                    "name": "Curries (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "FZDJ2P02A6T78",
        "name": "Shrimp Tikka Masala",
        "description": "",
        "price": 1599,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(non-veg)",
                    "name": "Curries (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "66VX5A9HEQ25T",
        "name": "Lamb Tikka Masala",
        "description": "",
        "price": 1699,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(non-veg)",
                    "name": "Curries (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "AANKFEE9CAHHJ",
        "name": "Lamb Curry",
        "description": "",
        "price": 1699,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(non-veg)",
                    "name": "Curries (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "N8DQ3ARGDDFVJ",
        "name": "Goat Korma",
        "description": "",
        "price": 1699,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(non-veg)",
                    "name": "Curries (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "4YD5TZN81KT40",
        "name": "Lamb Korma",
        "description": "",
        "price": 1699,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(non-veg)",
                    "name": "Curries (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "03P8EF3DYJ3YA",
        "name": "Gongura Chicken Curry",
        "description": "",
        "price": 1499,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(non-veg)",
                    "name": "Curries (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "5TVJ8HZMF2DDJ",
        "name": "Chicken Vindaloo",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(non-veg)",
                    "name": "Curries (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "TX2MRH70CR8ZA",
        "name": "Chicken Korma",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(non-veg)",
                    "name": "Curries (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "3NAEA04AJBWD4",
        "name": "Mutton Ghee Roast Biryani",
        "description": "",
        "price": 1899,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "0Y0FKEDV8KE8R",
        "name": "Chilli Shrimp",
        "description": "",
        "price": 1599,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(non-veg)",
                    "name": "Appetizer (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "ZWXHSBQEX780P",
        "name": "Karivepaku Fish Fry",
        "description": "",
        "price": 1699,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(non-veg)",
                    "name": "Appetizer (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "HTHR9BK9YG9NG",
        "name": "Fish 65 (Apollo)",
        "description": "",
        "price": 1699,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(non-veg)",
                    "name": "Appetizer (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "50DX5J9EY5FVE",
        "name": "Schezwan Fish",
        "description": "",
        "price": 1699,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(non-veg)",
                    "name": "Appetizer (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "MW70AWMEMKZWP",
        "name": "Karapodi Goat Fry",
        "description": "",
        "price": 1699,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(non-veg)",
                    "name": "Appetizer (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "B736GFDW5F13W",
        "name": "Pepper Lamb",
        "description": "",
        "price": 1599,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(non-veg)",
                    "name": "Appetizer (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "7ZRBE5BEZA35E",
        "name": "555 Shrimp",
        "description": "",
        "price": 1599,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(non-veg)",
                    "name": "Appetizer (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "5MEBVEQ5A4PP6",
        "name": "Pepper Shrimp",
        "description": "",
        "price": 1599,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(non-veg)",
                    "name": "Appetizer (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "6VKYYPKZZNKZR",
        "name": "Karivepaku Chicken",
        "description": "",
        "price": 1499,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(non-veg)",
                    "name": "Appetizer (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "3BNDMJ9BV4SRW",
        "name": "Double Ka Meeta",
        "description": "",
        "price": 499,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-desserts-\\u0026-ice-creams",
                    "name": "Desserts \\u0026 Ice Creams"
                }
            ]
        }
    },
    {
        "id": "MVW2AP071T326",
        "name": "Paneer Hariyali Kabab",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-tandoori-(veg)",
                    "name": "Tandoori (Veg)"
                }
            ]
        }
    },
    {
        "id": "370RJ1XWTMXX8",
        "name": "Paneer Malai Kabab",
        "description": "",
        "price": 1499,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-tandoori-(veg)",
                    "name": "Tandoori (Veg)"
                }
            ]
        }
    },
    {
        "id": "S5G8DETRX8HT0",
        "name": "Malai Shrimp",
        "description": "",
        "price": 1699,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-tandoori-(non-veg)",
                    "name": "Tandoori (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "T3G8CZS353SFC",
        "name": "Tandoori Shrimp",
        "description": "",
        "price": 1699,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-tandoori-(non-veg)",
                    "name": "Tandoori (Non-Veg)"
                },
                {
                    "id": "cat-tandoori",
                    "name": "Tandoori"
                }
            ]
        }
    },
    {
        "id": "2W8DQE9QXAM1G",
        "name": "Hariyali Chicken Kabab",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-tandoori-(non-veg)",
                    "name": "Tandoori (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "WT54FWGG5P3KA",
        "name": "Fry Piece Chicken Biryani",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "T840DFFYA769G",
        "name": "Bullet Naan",
        "description": "",
        "price": 349,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-tandoori-(breads)",
                    "name": "Tandoori (Breads)"
                },
                {
                    "id": "cat-tandoori",
                    "name": "Tandoori"
                }
            ]
        }
    },
    {
        "id": "SGYDTWAZV06TR",
        "name": "Kashmiri Naan",
        "description": "",
        "price": 399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-tandoori-(breads)",
                    "name": "Tandoori (Breads)"
                },
                {
                    "id": "cat-tandoori",
                    "name": "Tandoori"
                }
            ]
        }
    },
    {
        "id": "KP05TRSZ0J1S4",
        "name": "Veg Korma",
        "description": "",
        "price": 1299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(veg)",
                    "name": "Curries (Veg)"
                }
            ]
        }
    },
    {
        "id": "5JH5CZHT019VC",
        "name": "Aloo Gobi Curry",
        "description": "",
        "price": 1299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(veg)",
                    "name": "Curries (Veg)"
                }
            ]
        }
    },
    {
        "id": "HAYAFZM3FZ98M",
        "name": "Chettinad Veg Curry",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(veg)",
                    "name": "Curries (Veg)"
                }
            ]
        }
    },
    {
        "id": "AEBJ5AK5P7H6G",
        "name": "Malai Kofta",
        "description": "",
        "price": 1499,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(veg)",
                    "name": "Curries (Veg)"
                }
            ]
        }
    },
    {
        "id": "KZ4QWNJTY3FRG",
        "name": "Temper Chicken Appetizer",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(non-veg)",
                    "name": "Appetizer (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "Y76YCJXE968Y4",
        "name": "Spicy Pepper Chicken",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(non-veg)",
                    "name": "Appetizer (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "VV3NYKPMJGBSG",
        "name": "Karapodi Chicken",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(non-veg)",
                    "name": "Appetizer (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "X5VG2MW3SPNDR",
        "name": "Schezwan Aloo",
        "description": "",
        "price": 1299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(veg)",
                    "name": "Appetizer (Veg)"
                }
            ]
        }
    },
    {
        "id": "7YEAGFDXY4XQT",
        "name": "Karapodi Gobi",
        "description": "",
        "price": 1299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(veg)",
                    "name": "Appetizer (Veg)"
                }
            ]
        }
    },
    {
        "id": "PJF6B36CE2398",
        "name": "Pepper Babycorn",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(veg)",
                    "name": "Appetizer (Veg)"
                }
            ]
        }
    },
    {
        "id": "3AQB3CGZ69Z24",
        "name": "Chilli Babycorn",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(veg)",
                    "name": "Appetizer (Veg)"
                }
            ]
        }
    },
    {
        "id": "4TD9042T602PT",
        "name": "Vegetable Pulao",
        "description": "",
        "price": 1299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-pulao",
                    "name": "Pulao"
                },
                {
                    "id": "cat-biryanis/pulao-(veg)",
                    "name": "Biryanis/Pulao (Veg)"
                }
            ]
        }
    },
    {
        "id": "M2FGMPHXWWMH8",
        "name": "Rava Dosa",
        "description": "",
        "price": 1099,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-breakfast/tiffins/dosa",
                    "name": "Breakfast/Tiffins/Dosa"
                }
            ]
        }
    },
    {
        "id": "FDSVJVB8ZRYTW",
        "name": "Chilli Paneer Gravy",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(veg)",
                    "name": "Curries (Veg)"
                }
            ]
        }
    },
    {
        "id": "79JP7BR3JCZ1Y",
        "name": "Water Bottle",
        "description": "",
        "price": 89,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-beverages",
                    "name": "Beverages"
                }
            ]
        }
    },
    {
        "id": "575VJ56N7DTNW",
        "name": "Mango Lassi",
        "description": "",
        "price": 399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-beverages",
                    "name": "Beverages"
                }
            ]
        }
    },
    {
        "id": "155S0GGKCQGT2",
        "name": "Diet Coke",
        "description": "",
        "price": 149,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-beverages",
                    "name": "Beverages"
                }
            ]
        }
    },
    {
        "id": "K5KS7K1QT2V4R",
        "name": "Fanta",
        "description": "",
        "price": 149,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-beverages",
                    "name": "Beverages"
                }
            ]
        }
    },
    {
        "id": "7T81TSWR0TJBY",
        "name": "Coke",
        "description": "",
        "price": 149,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-beverages",
                    "name": "Beverages"
                }
            ]
        }
    },
    {
        "id": "A5MJ6PZZ282RG",
        "name": "Dr Pepper",
        "description": "",
        "price": 149,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-beverages",
                    "name": "Beverages"
                }
            ]
        }
    },
    {
        "id": "NED21EHP3KSQT",
        "name": "Sprite",
        "description": "",
        "price": 149,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-beverages",
                    "name": "Beverages"
                }
            ]
        }
    },
    {
        "id": "EXJDH1ZD85MTP",
        "name": "Spl Kushi Filter Coffee (6 oz)",
        "description": "",
        "price": 299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-beverages",
                    "name": "Beverages"
                }
            ]
        }
    },
    {
        "id": "DN1YZSBR5PH7T",
        "name": "Rasmalai (4 pcs)",
        "description": "",
        "price": 499,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-desserts-\\u0026-ice-creams",
                    "name": "Desserts \\u0026 Ice Creams"
                }
            ]
        }
    },
    {
        "id": "95SWPB26PRGQA",
        "name": "Gulab jamun (4 pcs)",
        "description": "",
        "price": 499,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-desserts-\\u0026-ice-creams",
                    "name": "Desserts \\u0026 Ice Creams"
                }
            ]
        }
    },
    {
        "id": "HC1715VTHMP16",
        "name": "Carrot Halwa",
        "description": "",
        "price": 549,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-desserts-\\u0026-ice-creams",
                    "name": "Desserts \\u0026 Ice Creams"
                }
            ]
        }
    },
    {
        "id": "706C34EW75DT2",
        "name": "Shrimp Curry",
        "description": "",
        "price": 1599,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(non-veg)",
                    "name": "Curries (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "H76Q46KJM0GVJ",
        "name": "Gongura Goat Fry",
        "description": "",
        "price": 1899,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(non-veg)",
                    "name": "Appetizer (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "CGNRTHE22F3ZP",
        "name": "Chettinad Goat Curry",
        "description": "",
        "price": 1799,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(non-veg)",
                    "name": "Curries (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "YGZWK7W3PMWCM",
        "name": "Goat Curry",
        "description": "",
        "price": 1699,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(non-veg)",
                    "name": "Curries (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "6Y7DDZ4D829MG",
        "name": "Saag Chicken",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(non-veg)",
                    "name": "Curries (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "839JEJKPK2VSY",
        "name": "Kadai Chicken",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(non-veg)",
                    "name": "Curries (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "J0SM5KT12191W",
        "name": "Andhra Chicken Curry",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(non-veg)",
                    "name": "Curries (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "EEAH10SFGWNKY",
        "name": "Chicken Chettinad",
        "description": "",
        "price": 1499,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(non-veg)",
                    "name": "Curries (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "XB1KXZCXQKNRP",
        "name": "Chicken Tikka Masala",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(non-veg)",
                    "name": "Curries (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "5AGM5TKQ5Y650",
        "name": "Butter Chicken",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(non-veg)",
                    "name": "Curries (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "2GGBFA70911K6",
        "name": "Egg Masala Curry",
        "description": "",
        "price": 1499,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(non-veg)",
                    "name": "Curries (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "EN9KFAQA7KK98",
        "name": "Saag Paneer",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(veg)",
                    "name": "Curries (Veg)"
                }
            ]
        }
    },
    {
        "id": "NNS7NP58DSPT6",
        "name": "Kadai Paneer",
        "description": "",
        "price": 1499,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(veg)",
                    "name": "Curries (Veg)"
                }
            ]
        }
    },
    {
        "id": "2N2G24A7M8QY2",
        "name": "Shahi Paneer",
        "description": "",
        "price": 1499,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(veg)",
                    "name": "Curries (Veg)"
                }
            ]
        }
    },
    {
        "id": "GKPCQYW819M22",
        "name": "Paneer Tikka Masala",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(veg)",
                    "name": "Curries (Veg)"
                }
            ]
        }
    },
    {
        "id": "28T4TM1J2DYZ2",
        "name": "Paneer Butter Masala",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(veg)",
                    "name": "Curries (Veg)"
                }
            ]
        }
    },
    {
        "id": "DATVQ5N1XKKRR",
        "name": "Gutti Vankaya Masala/Curry",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(veg)",
                    "name": "Curries (Veg)"
                }
            ]
        }
    },
    {
        "id": "EBNX8P7YRZC42",
        "name": "Channa Masala",
        "description": "",
        "price": 1199,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(veg)",
                    "name": "Curries (Veg)"
                }
            ]
        }
    },
    {
        "id": "QH5VCMZNK113R",
        "name": "Andhra Veg Curry",
        "description": "",
        "price": 1299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(veg)",
                    "name": "Curries (Veg)"
                }
            ]
        }
    },
    {
        "id": "D4N9EM0PYYSZA",
        "name": "Mixed Vegetable Korma",
        "description": "",
        "price": 1299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(veg)",
                    "name": "Curries (Veg)"
                }
            ]
        }
    },
    {
        "id": "HPGK6K5252KAR",
        "name": "Dal Fry / Dal Thadka",
        "description": "",
        "price": 1199,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-curries-(veg)",
                    "name": "Curries (Veg)"
                }
            ]
        }
    },
    {
        "id": "WN9H3FY54S7DJ",
        "name": "Bread basket (All mixed naans 3 )",
        "description": "",
        "price": 899,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-tandoori-(breads)",
                    "name": "Tandoori (Breads)"
                },
                {
                    "id": "cat-tandoori",
                    "name": "Tandoori"
                }
            ]
        }
    },
    {
        "id": "DJNYV4VN5XQGG",
        "name": "Lachha paratha",
        "description": "",
        "price": 179,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-tandoori-(breads)",
                    "name": "Tandoori (Breads)"
                }
            ]
        }
    },
    {
        "id": "D244WMRAT84TP",
        "name": "Tandoor Roti (made with aata)",
        "description": "",
        "price": 299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-tandoori-(breads)",
                    "name": "Tandoori (Breads)"
                },
                {
                    "id": "cat-tandoori",
                    "name": "Tandoori"
                }
            ]
        }
    },
    {
        "id": "AXTDR582C0Z2G",
        "name": "Garlic Naan",
        "description": "",
        "price": 349,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-tandoori-(breads)",
                    "name": "Tandoori (Breads)"
                },
                {
                    "id": "cat-tandoori",
                    "name": "Tandoori"
                }
            ]
        }
    },
    {
        "id": "XMHA4KB1CAEB8",
        "name": "Butter Naan",
        "description": "",
        "price": 349,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-tandoori-(breads)",
                    "name": "Tandoori (Breads)"
                },
                {
                    "id": "cat-tandoori",
                    "name": "Tandoori"
                }
            ]
        }
    },
    {
        "id": "V15DF8WR4XZB6",
        "name": "Plain Naan",
        "description": "",
        "price": 299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-tandoori-(breads)",
                    "name": "Tandoori (Breads)"
                },
                {
                    "id": "cat-tandoori",
                    "name": "Tandoori"
                }
            ]
        }
    },
    {
        "id": "TTG7D1T7D9Z8E",
        "name": "Shrimp Biryani",
        "description": "",
        "price": 1799,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "8TB9A6Q0BSHWW",
        "name": "Chinta Chiguru Goat Biryani",
        "description": "",
        "price": 1899,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "NKKSAZKJVK08W",
        "name": "Goat Dum Biryani",
        "description": "",
        "price": 1799,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "SAFSA5EXKF8YG",
        "name": "Mutton Keema Biryani",
        "description": "",
        "price": 1899,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "K8SV4KWD24G5G",
        "name": "Gongura Chicken Biryani",
        "description": "",
        "price": 1499,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "YQKE2Q9KRGDP6",
        "name": "Kushi Spl Boneless Chicken Biryani",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "DEMO-KUSHI-PULAO-123",
        "name": "Kushi Spl Boneless Pulao",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "6MM48NVPRXT0A",
        "name": "Hyd Chicken Dum Biryani",
        "description": "",
        "price": 1299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "MEX71Q1V295C6",
        "name": "Egg Dum Biryani",
        "description": "",
        "price": 1299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(non-veg)",
                    "name": "Biryanis/Pulao (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "923F5HZKHFVKP",
        "name": "Gutti Vankaya Biryani",
        "description": "",
        "price": 1499,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(veg)",
                    "name": "Biryanis/Pulao (Veg)"
                }
            ]
        }
    },
    {
        "id": "GA1FASPY3DPH0",
        "name": "Paneer Biryani Veg",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(veg)",
                    "name": "Biryanis/Pulao (Veg)"
                }
            ]
        }
    },
    {
        "id": "AJKDA4PYP8Z2A",
        "name": "Veg Dum Biryani",
        "description": "",
        "price": 1299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-biryanis/pulao-(veg)",
                    "name": "Biryanis/Pulao (Veg)"
                }
            ]
        }
    },
    {
        "id": "6N09GWC09VFXP",
        "name": "Sambar (4 oz)",
        "description": "",
        "price": 100,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-extras-add-on's",
                    "name": "Extras Add On's"
                }
            ]
        }
    },
    {
        "id": "9W7GTZFXYXXK6",
        "name": "Peanut Chutney (3.25 oz)",
        "description": "",
        "price": 79,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-extras-add-on's",
                    "name": "Extras Add On's"
                }
            ]
        }
    },
    {
        "id": "CR89K4GWH948G",
        "name": "Coconut Chutney (3.25 oz)",
        "description": "",
        "price": 79,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-extras-add-on's",
                    "name": "Extras Add On's"
                }
            ]
        }
    },
    {
        "id": "G9TNKNC6XJWPT",
        "name": "Chole Poori 3Pc",
        "description": "",
        "price": 899,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-breakfast/tiffins/dosa",
                    "name": "Breakfast/Tiffins/Dosa"
                }
            ]
        }
    },
    {
        "id": "J1DCAVDX7GPTJ",
        "name": "Mix Veg Uttappam",
        "description": "",
        "price": 1099,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-breakfast/tiffins/dosa",
                    "name": "Breakfast/Tiffins/Dosa"
                }
            ]
        }
    },
    {
        "id": "4V0RT0X547R66",
        "name": "Onion Uttappam",
        "description": "",
        "price": 999,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-breakfast/tiffins/dosa",
                    "name": "Breakfast/Tiffins/Dosa"
                }
            ]
        }
    },
    {
        "id": "JPXXPMP1VAS0Y",
        "name": "Plain Uttapam",
        "description": "",
        "price": 899,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-breakfast/tiffins/dosa",
                    "name": "Breakfast/Tiffins/Dosa"
                }
            ]
        }
    },
    {
        "id": "G5QQEPGKSJ12P",
        "name": "Ghee Masala Dosa",
        "description": "",
        "price": 999,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-breakfast/tiffins/dosa",
                    "name": "Breakfast/Tiffins/Dosa"
                }
            ]
        }
    },
    {
        "id": "06HJEGBG59AE0",
        "name": "Karam podi Dosa",
        "description": "",
        "price": 999,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-breakfast/tiffins/dosa",
                    "name": "Breakfast/Tiffins/Dosa"
                }
            ]
        }
    },
    {
        "id": "32Q8FFNJX58HP",
        "name": "Onion Masala Dosa",
        "description": "",
        "price": 999,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-breakfast/tiffins/dosa",
                    "name": "Breakfast/Tiffins/Dosa"
                }
            ]
        }
    },
    {
        "id": "A2Z0594YQE8ZR",
        "name": "Onion Dosa",
        "description": "",
        "price": 899,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-breakfast/tiffins/dosa",
                    "name": "Breakfast/Tiffins/Dosa"
                }
            ]
        }
    },
    {
        "id": "9EP3M9RJ0C8BT",
        "name": "Masala Dosa",
        "description": "",
        "price": 899,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-breakfast/tiffins/dosa",
                    "name": "Breakfast/Tiffins/Dosa"
                }
            ]
        }
    },
    {
        "id": "YH387DHWWX5JT",
        "name": "Plain Dosa",
        "description": "",
        "price": 799,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-breakfast/tiffins/dosa",
                    "name": "Breakfast/Tiffins/Dosa"
                }
            ]
        }
    },
    {
        "id": "7GXVKSTXGM2HR",
        "name": "Vada Sambar(2 pcs)",
        "description": "",
        "price": 599,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-breakfast/tiffins/dosa",
                    "name": "Breakfast/Tiffins/Dosa"
                }
            ]
        }
    },
    {
        "id": "95F0AHHKHJWNG",
        "name": "Idli (3 pcs )",
        "description": "",
        "price": 599,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-breakfast/tiffins/dosa",
                    "name": "Breakfast/Tiffins/Dosa"
                }
            ]
        }
    },
    {
        "id": "8E1QE9VKH3MAT",
        "name": "Shrimp Fried Rice",
        "description": "",
        "price": 1799,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-noodles-\\u0026-fried-rice",
                    "name": "Noodles \\u0026 Fried Rice"
                }
            ]
        }
    },
    {
        "id": "V483G7Q692W5C",
        "name": "Chicken Fried Rice",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-noodles-\\u0026-fried-rice",
                    "name": "Noodles \\u0026 Fried Rice"
                }
            ]
        }
    },
    {
        "id": "2CXY9X38Z98C6",
        "name": "Egg Fried Rice",
        "description": "",
        "price": 1299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-noodles-\\u0026-fried-rice",
                    "name": "Noodles \\u0026 Fried Rice"
                }
            ]
        }
    },
    {
        "id": "FC0DQVQDSESFE",
        "name": "Veg Fried Rice",
        "description": "",
        "price": 1299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-noodles-\\u0026-fried-rice",
                    "name": "Noodles \\u0026 Fried Rice"
                }
            ]
        }
    },
    {
        "id": "TACD6QSR5GHCG",
        "name": "Shrimp Noodles",
        "description": "",
        "price": 1799,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-noodles-\\u0026-fried-rice",
                    "name": "Noodles \\u0026 Fried Rice"
                }
            ]
        }
    },
    {
        "id": "JB9MXT2H05SC6",
        "name": "Chicken Noodles",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-noodles-\\u0026-fried-rice",
                    "name": "Noodles \\u0026 Fried Rice"
                }
            ]
        }
    },
    {
        "id": "MRFQWEJWPCXYP",
        "name": "Egg Noodles",
        "description": "",
        "price": 1299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-noodles-\\u0026-fried-rice",
                    "name": "Noodles \\u0026 Fried Rice"
                }
            ]
        }
    },
    {
        "id": "88P3HG3BW6W2J",
        "name": "Veg Noodles",
        "description": "",
        "price": 1299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-noodles-\\u0026-fried-rice",
                    "name": "Noodles \\u0026 Fried Rice"
                }
            ]
        }
    },
    {
        "id": "YQAGDWV8H7NKM",
        "name": "Tandoori Chicken",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-tandoori-(non-veg)",
                    "name": "Tandoori (Non-Veg)"
                },
                {
                    "id": "cat-tandoori",
                    "name": "Tandoori"
                }
            ]
        }
    },
    {
        "id": "17WDN9VFSEK1R",
        "name": "Chicken Tikka Sizzler (Dry)",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-tandoori-(non-veg)",
                    "name": "Tandoori (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "3WCAVDH0Y268E",
        "name": "Grilled Vegetables",
        "description": "",
        "price": 1299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-tandoori-(veg)",
                    "name": "Tandoori (Veg)"
                }
            ]
        }
    },
    {
        "id": "Q25YHWWQ4YGW2",
        "name": "Paneer Tikka Sizzler (Dry)",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-tandoori-(veg)",
                    "name": "Tandoori (Veg)"
                }
            ]
        }
    },
    {
        "id": "VHPANME784GAW",
        "name": "Chili Fish",
        "description": "",
        "price": 1699,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(non-veg)",
                    "name": "Appetizer (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "1TCAKGY6AA4PY",
        "name": "Goat Pepper Fry",
        "description": "",
        "price": 1699,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(non-veg)",
                    "name": "Appetizer (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "D32CAWK4WXF0W",
        "name": "Goat Chukka",
        "description": "",
        "price": 1899,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(non-veg)",
                    "name": "Appetizer (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "7ZJ14X63RKNBC",
        "name": "Ginger Chicken",
        "description": "",
        "price": 1499,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(non-veg)",
                    "name": "Appetizer (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "HFBQE4QD6C8NY",
        "name": "Chicken 65",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(non-veg)",
                    "name": "Appetizer (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "67JH9366WJ83C",
        "name": "Chilli Chicken",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(non-veg)",
                    "name": "Appetizer (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "B8DKSNKRP70H8",
        "name": "Chicken Majestic",
        "description": "",
        "price": 1399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(non-veg)",
                    "name": "Appetizer (Non-Veg)"
                }
            ]
        }
    },
    {
        "id": "RHQHG9ERFZSV8",
        "name": "Paneer 65",
        "description": "",
        "price": 1299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(veg)",
                    "name": "Appetizer (Veg)"
                }
            ]
        }
    },
    {
        "id": "QRBBJ4V3BREJM",
        "name": "Paneer Manchuria",
        "description": "",
        "price": 1299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(veg)",
                    "name": "Appetizer (Veg)"
                }
            ]
        }
    },
    {
        "id": "GW06P9YSWKZ5M",
        "name": "Chili Paneer",
        "description": "",
        "price": 1299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(veg)",
                    "name": "Appetizer (Veg)"
                }
            ]
        }
    },
    {
        "id": "99XDWPMAHKJY6",
        "name": "Gobi 65",
        "description": "",
        "price": 1299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(veg)",
                    "name": "Appetizer (Veg)"
                }
            ]
        }
    },
    {
        "id": "1G9FT19S3QWST",
        "name": "Gobi Manchurian",
        "description": "",
        "price": 1299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(veg)",
                    "name": "Appetizer (Veg)"
                }
            ]
        }
    },
    {
        "id": "JEN5D9VARK51J",
        "name": "Chili Gobi",
        "description": "",
        "price": 1299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(veg)",
                    "name": "Appetizer (Veg)"
                }
            ]
        }
    },
    {
        "id": "R4XA6J6HS19RA",
        "name": "Veg Manchuria",
        "description": "",
        "price": 1299,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-appetizer-(veg)",
                    "name": "Appetizer (Veg)"
                }
            ]
        }
    },
    {
        "id": "APJRG0A77ZQ98",
        "name": "Railway Samosa (4 pcs)",
        "description": "",
        "price": 399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-evening-snacks",
                    "name": "Evening Snacks"
                }
            ]
        }
    },
    {
        "id": "M8CXVDPJS3H1Y",
        "name": "Samosa (Veg) 2 Pcs",
        "description": "",
        "price": 399,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-evening-snacks",
                    "name": "Evening Snacks"
                }
            ]
        }
    },
    {
        "id": "KMAWT27TR424T",
        "name": "Street Style Onion Pakoda",
        "description": "",
        "price": 599,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-evening-snacks",
                    "name": "Evening Snacks"
                }
            ]
        }
    },
    {
        "id": "3MDMHC1CRQ778",
        "name": "Golden Brown Punugulu (15 pcs)",
        "description": "",
        "price": 699,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-breakfast/tiffins/dosa",
                    "name": "Breakfast/Tiffins/Dosa"
                },
                {
                    "id": "cat-evening-snacks",
                    "name": "Evening Snacks"
                }
            ]
        }
    },
    {
        "id": "20DK0R2D859C0",
        "name": "Vada (3 pcs)",
        "description": "",
        "price": 699,
        "available": true,
        "itemStock": {
            "quantity": 10
        },
        "categories": {
            "elements": [
                {
                    "id": "cat-breakfast/tiffins/dosa",
                    "name": "Breakfast/Tiffins/Dosa"
                }
            ]
        }
    }
];

// Load Configuration from LocalStorage
function loadConfig() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('clear_config') === 'true') {
        localStorage.removeItem('clover_menu_config');
        localStorage.removeItem('clover_menu_mock_inventory');
        const cleanSearch = window.location.search.replace(/[&?]clear_config=true/, '').replace(/^&/, '?');
        window.location.href = window.location.pathname + cleanSearch + window.location.hash;
        return;
    }

    const saved = localStorage.getItem('clover_menu_config');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            config = { ...DEFAULT_CONFIG, ...parsed };
            // Safeguard: If mappings are completely missing or all empty (due to save in invalid/offline live mode), restore defaults
            if (!config.mappings || Object.values(config.mappings).every(v => !v)) {
                config.mappings = { ...DEFAULT_CONFIG.mappings };
            }
        } catch (e) {
            console.error('Error parsing config, resetting to default:', e);
        }
    }
    applyOrientationClass(config.orientation);
}

// Apply Screen Orientation Styles dynamically
function applyOrientationClass(orientation) {
    document.body.classList.remove('orientation-portrait', 'orientation-landscape', 'orientation-rotate90', 'orientation-rotate270');
    document.body.classList.add(`orientation-${orientation || 'portrait'}`);
}

// Save Configuration to LocalStorage
function saveConfig(newConfig) {
    config = { ...config, ...newConfig };
    localStorage.setItem('clover_menu_config', JSON.stringify(config));
}

// 2. CLOVER API INTERFACE CLIENT
function getCloverBaseUrl() {
    return '/clover-api';
}

async function cloverRequest(path, options = {}) {
    const baseUrl = getCloverBaseUrl();
    const url = config.merchantId ? `${baseUrl}/merchants/${config.merchantId}${path}` : `${baseUrl}${path}`;

    const headers = {
        'Authorization': `Bearer ${config.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Clover-Env': config.environment || 'prod'
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Clover API Error (${response.status}): ${errText || response.statusText}`);
    }

    return response.status === 204 ? null : response.json();
}



async function testCloverConnection() {
    // Perform a lightweight API call to verify credentials and merchant access
    const result = await cloverRequest('/items?limit=1');
    if (!result || !('elements' in result)) {
        throw new Error('Unexpected Clover API response while validating credentials.');
    }
    return true;
}

// Helper to merge local overrides into item tags list
function applyLocalOverrides(items) {
    if (!items || !Array.isArray(items)) return items;
    const localHidden = JSON.parse(localStorage.getItem('clover_menu_local_hidden') || '[]');
    const localBlurred = JSON.parse(localStorage.getItem('clover_menu_local_blurred') || '[]');

    items.forEach(item => {
        if (!item.tags) item.tags = { elements: [] };
        if (!item.tags.elements) item.tags.elements = [];

        if (localHidden.includes(item.id)) {
            if (!item.tags.elements.some(t => t.name === 'hidden-tv')) {
                item.tags.elements.push({ id: 'local-hidden', name: 'hidden-tv' });
            }
        }
        if (localBlurred.includes(item.id)) {
            if (!item.tags.elements.some(t => t.name === 'blur-tv')) {
                item.tags.elements.push({ id: 'local-blur', name: 'blur-tv' });
            }
        }
    });
    return items;
}

// Fetch Inventory, including Categories, Tags, and ItemStock
async function fetchCloverInventory() {
    if (config.mode === 'demo') {
        // Load custom demo inventory modifications from localStorage if exists
        const localMock = localStorage.getItem('clover_menu_mock_inventory');
        if (localMock) {
            try {
                inventoryData = JSON.parse(localMock);
            } catch (e) {
                inventoryData = [...DEMO_INVENTORY];
            }
        } else {
            inventoryData = [...DEMO_INVENTORY];
        }
        return inventoryData;
    }

    try {
        // Fetch items with expanded categories, tags, and stock with pagination support
        let allItems = [];
        let limit = 100; // Standard Clover API page limit to prevent capping bugs
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
            try {
                const data = await cloverRequest(`/items?limit=${limit}&offset=${offset}&expand=categories,tags,itemStock`);
                const elements = data.elements || [];
                if (elements.length === 0) {
                    hasMore = false;
                } else {
                    allItems = allItems.concat(elements);
                    offset += elements.length; // Move offset by actual elements returned
                    if (elements.length < limit) {
                        hasMore = false;
                    } else {
                        // Pause 250ms between pages to respect Clover API rate limits
                        await new Promise(r => setTimeout(r, 250));
                    }
                }
            } catch (pageErr) {
                console.warn('Clover pagination stopped due to rate limit or end of items:', pageErr);
                hasMore = false;
            }
        }

        // Apply local storage overrides
        allItems = applyLocalOverrides(allItems);

        inventoryData = allItems;

        // Cache successful fetch
        try {
            localStorage.setItem('clover_menu_live_cache', JSON.stringify(inventoryData));
        } catch (e) {
            console.warn('Failed to cache live inventory to localStorage:', e);
        }

        // Auto-provision tags if setting enabled (only once per session)
        if (config.autoTags && !cloverTags['hidden-tv']) {
            try {
                await ensureCloverTagsExist();
            } catch (tagError) {
                console.warn('Failed to auto-provision tags (check token permissions):', tagError);
            }
        }

        return inventoryData;
    } catch (error) {
        console.error('Clover data fetch failed. Error:', error);

        // If inventoryData is already loaded in memory, retain current state silently
        if (inventoryData && inventoryData.length > 0) {
            console.warn('Clover request rate-limited or failed. Retaining current inventory in memory.');
            return inventoryData;
        }

        // Fallback to cache if available
        const cache = localStorage.getItem('clover_menu_live_cache');
        if (cache) {
            try {
                const cachedItems = JSON.parse(cache);
                inventoryData = applyLocalOverrides(cachedItems);
                return inventoryData;
            } catch (e) {
                console.error('Failed to parse cached live inventory:', e);
            }
        }

        // Only switch to demo if no data exists at all
        config.mode = 'demo';
        saveConfig(config);

        const localMock = localStorage.getItem('clover_menu_mock_inventory');
        if (localMock) {
            try {
                inventoryData = JSON.parse(localMock);
            } catch (e) {
                inventoryData = [...DEMO_INVENTORY];
            }
        } else {
            inventoryData = [...DEMO_INVENTORY];
        }

        return inventoryData;
    }
}

// Ensure "hidden-tv" and "blur-tv" tags exist on Clover
async function ensureCloverTagsExist() {
    try {
        const data = await cloverRequest('/tags');
        const tags = data.elements || [];

        const hiddenTag = tags.find(t => t.name === 'hidden-tv');
        const blurTag = tags.find(t => t.name === 'blur-tv');

        if (hiddenTag) cloverTags['hidden-tv'] = hiddenTag.id;
        else {
            const newTag = await cloverRequest('/tags', {
                method: 'POST',
                body: JSON.stringify({ name: 'hidden-tv' })
            });
            cloverTags['hidden-tv'] = newTag.id;
        }

        if (blurTag) cloverTags['blur-tv'] = blurTag.id;
        else {
            const newTag = await cloverRequest('/tags', {
                method: 'POST',
                body: JSON.stringify({ name: 'blur-tv' })
            });
            cloverTags['blur-tv'] = newTag.id;
        }
    } catch (e) {
        console.error('Failed to ensure Clover tags exist:', e);
    }
}

// Helper to save override to local storage
function saveLocalOverride(itemId, tagName, active) {
    const key = tagName === 'hidden-tv' ? 'clover_menu_local_hidden' : 'clover_menu_local_blurred';
    let list = [];
    try {
        list = JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) { }

    if (active) {
        if (!list.includes(itemId)) list.push(itemId);
    } else {
        list = list.filter(id => id !== itemId);
    }
    localStorage.setItem(key, JSON.stringify(list));
}

// Helper to remove override from local storage
function removeLocalOverride(itemId, tagName) {
    saveLocalOverride(itemId, tagName, false);
}

// Add/Remove a tag on Clover
async function toggleCloverTag(itemId, tagName, active) {
    if (config.mode === 'demo') {
        // Handle locally
        const idx = inventoryData.findIndex(item => item.id === itemId);
        if (idx !== -1) {
            // Safely initialize tags if missing (demo items may not have tags)
            if (!inventoryData[idx].tags) {
                inventoryData[idx].tags = { elements: [] };
            }
            if (!inventoryData[idx].tags.elements) {
                inventoryData[idx].tags.elements = [];
            }
            let tags = inventoryData[idx].tags.elements;
            if (active) {
                // Add tag
                if (!tags.some(t => t.name === tagName)) {
                    tags.push({ id: `tag-${tagName}`, name: tagName });
                }
            } else {
                // Remove tag
                tags = tags.filter(t => t.name !== tagName);
            }
            inventoryData[idx].tags.elements = tags;
            localStorage.setItem('clover_menu_mock_inventory', JSON.stringify(inventoryData));
        }
        return true;
    }

    try {
        // Ensure tags are loaded
        if (!cloverTags[tagName]) {
            await ensureCloverTagsExist();
        }

        const tagId = cloverTags[tagName];
        if (!tagId) throw new Error(`Tag "${tagName}" is not provisioned on Clover`);

        // Check if item has tag assigned currently
        const item = inventoryData.find(i => i.id === itemId);
        const hasTag = item && item.tags && item.tags.elements && item.tags.elements.some(t => t.name === tagName);

        if (active && !hasTag) {
            // Add Association
            await cloverRequest('/tag_items', {
                method: 'POST',
                body: JSON.stringify({
                    elements: [{
                        tag: { id: tagId },
                        item: { id: itemId }
                    }]
                })
            });
            showToast(`Applied ${tagName} override.`, 'success');
        } else if (!active && hasTag) {
            // Delete Association
            await cloverRequest('/tag_items?delete=true', {
                method: 'POST',
                body: JSON.stringify({
                    elements: [{
                        tag: { id: tagId },
                        item: { id: itemId }
                    }]
                })
            });
            showToast(`Removed ${tagName} override.`, 'success');
        }

        // Clean up from local storage override since it was successfully written to Clover
        removeLocalOverride(itemId, tagName);

        // Refresh local data
        await fetchCloverInventory();
        return true;
    } catch (e) {
        console.warn(`Clover tag write failed, falling back to local storage override for item ${itemId}:`, e);

        // Save override locally
        saveLocalOverride(itemId, tagName, active);
        showToast('Clover sync failed. Saved override locally.', 'warning');

        // Manually update the local item state in memory so it updates immediately in UI
        const item = inventoryData.find(i => i.id === itemId);
        if (item) {
            if (!item.tags) item.tags = { elements: [] };
            if (!item.tags.elements) item.tags.elements = [];

            if (active) {
                if (!item.tags.elements.some(t => t.name === tagName)) {
                    item.tags.elements.push({ id: `local-${tagName}`, name: tagName });
                }
            } else {
                item.tags.elements = item.tags.elements.filter(t => t.name !== tagName);
            }
        }
        return true;
    }
}

// 3. UI RENDERING ENGINES

// Active state variables for layout recalculation on window resize
let currentTVItems = [];
let currentTVAllowedCategories = [];

// Helper to combine ONLY true matching Biryani & Pulao pairs into a single display row ("Name Biryani / Pulao")
function combineBiryaniPulaoItems(itemList) {
    const result = [];
    const usedIndices = new Set();

    // Helper to check if two item names form a true Biryani/Pulao pair
    function areItemsBiryaniPulaoPair(nameA, nameB) {
        const normA = nameA.toLowerCase().replace(/(biryani|briyani|pulao|pulav).*/i, '').replace(/\bspl\b/gi, 'special').replace(/\s+/g, ' ').trim();
        const normB = nameB.toLowerCase().replace(/(biryani|briyani|pulao|pulav).*/i, '').replace(/\bspl\b/gi, 'special').replace(/\s+/g, ' ').trim();

        if (!normA || !normB) return false;

        // 1. Exact match of normalized base prefix
        if (normA === normB) return true;

        // 2. Check protein/ingredient conflict to prevent mis-pairing different meats (e.g. Chicken vs Mutton/Egg)
        const proteins = ['chicken', 'mutton', 'goat', 'lamb', 'egg', 'shrimp', 'prawn', 'fish', 'gobi', 'paneer', 'veg'];
        const proteinsInA = proteins.filter(p => normA.includes(p));
        const proteinsInB = proteins.filter(p => normB.includes(p));

        if (proteinsInA.length > 0 && proteinsInB.length > 0) {
            const hasOverlap = proteinsInA.some(p => proteinsInB.includes(p));
            if (!hasOverlap) return false; // Different main ingredients!
        }

        // 3. Compare leading words
        const wordsA = normA.split(' ');
        const wordsB = normB.split(' ');
        const minWords = Math.min(wordsA.length, wordsB.length);
        if (minWords < 2) return false;

        let matchCount = 0;
        for (let i = 0; i < minWords; i++) {
            if (wordsA[i] === wordsB[i]) {
                matchCount++;
            } else {
                break;
            }
        }

        return matchCount === minWords;
    }

    for (let i = 0; i < itemList.length; i++) {
        if (usedIndices.has(i)) continue;

        let item = itemList[i];
        let nameLower = item.name.toLowerCase();

        // Skip if already formatted with slash pulao
        if (nameLower.includes('/ pulao') || nameLower.includes('/pulao') || nameLower.includes('/ pulav') || nameLower.includes('/pulav')) {
            result.push(item);
            continue;
        }

        const isBiryani = nameLower.includes('biryani') || nameLower.includes('briyani');
        const isPulao = nameLower.includes('pulao') || nameLower.includes('pulav');

        // Must be either a Biryani or a Pulao to participate in pairing
        if (isBiryani || isPulao) {
            let matchedIdx = -1;

            for (let j = 0; j < itemList.length; j++) {
                if (i === j || usedIndices.has(j)) continue;
                let otherLower = itemList[j].name.toLowerCase();

                const otherIsTarget = isBiryani ? (otherLower.includes('pulao') || otherLower.includes('pulav')) : (otherLower.includes('biryani') || otherLower.includes('briyani'));

                if (otherIsTarget) {
                    if (areItemsBiryaniPulaoPair(item.name, itemList[j].name)) {
                        matchedIdx = j;
                        break;
                    }
                }
            }

            if (matchedIdx !== -1) {
                usedIndices.add(matchedIdx);
                const otherItem = itemList[matchedIdx];

                const biryaniObj = isBiryani ? item : otherItem;
                const pulaoObj = isPulao ? item : otherItem;

                const isBiryaniAvail = (biryaniObj.available !== false) && (biryaniObj.autoManage !== true || !biryaniObj.itemStock || biryaniObj.itemStock.quantity > 0) && (!biryaniObj.tags || !biryaniObj.tags.elements || !biryaniObj.tags.elements.some(t => t.name === 'blur-tv' || t.name === 'hidden-tv'));

                const isPulaoAvail = (pulaoObj.available !== false) && (pulaoObj.autoManage !== true || !pulaoObj.itemStock || pulaoObj.itemStock.quantity > 0) && (!pulaoObj.tags || !pulaoObj.tags.elements || !pulaoObj.tags.elements.some(t => t.name === 'blur-tv' || t.name === 'hidden-tv'));

                let baseBiryaniName = biryaniObj.name.trim();
                let bMatch = baseBiryaniName.match(/(biryani|briyani)/i);

                let stemText = '';
                let biryaniText = 'Biryani';
                let pulaoText = 'Pulao';

                if (bMatch) {
                    let idx = bMatch.index;
                    stemText = baseBiryaniName.substring(0, idx).trim();
                    biryaniText = baseBiryaniName.substring(idx, idx + bMatch[0].length);
                } else {
                    stemText = baseBiryaniName;
                }

                let pMatch = pulaoObj.name.match(/(pulao|pulav)/i);
                if (pMatch) {
                    let pIdx = pMatch.index;
                    pulaoText = pulaoObj.name.substring(pIdx, pIdx + pMatch[0].length);
                }

                const combinedName = `${stemText ? stemText + ' ' : ''}${biryaniText} / ${pulaoText}`.replace(/\s+/g, ' ').trim();

                const isBiryaniHidden = biryaniObj.tags && biryaniObj.tags.elements && biryaniObj.tags.elements.some(t => t.name === 'hidden-tv');
                const isPulaoHidden = pulaoObj.tags && pulaoObj.tags.elements && pulaoObj.tags.elements.some(t => t.name === 'hidden-tv');

                const isBiryaniBlurred = biryaniObj.tags && biryaniObj.tags.elements && biryaniObj.tags.elements.some(t => t.name === 'blur-tv');
                const isPulaoBlurred = pulaoObj.tags && pulaoObj.tags.elements && pulaoObj.tags.elements.some(t => t.name === 'blur-tv');

                const isCombinedAvail = isBiryaniAvail || isPulaoAvail;

                let combinedTags = [];
                if (biryaniObj.tags && biryaniObj.tags.elements) {
                    combinedTags = biryaniObj.tags.elements.filter(t => t.name !== 'hidden-tv' && t.name !== 'blur-tv');
                }

                // If BOTH variants are marked hidden-tv, pass hidden-tv tag so the item is hidden from TV
                if (isBiryaniHidden && isPulaoHidden) {
                    combinedTags.push({ id: 'tag-hidden-tv', name: 'hidden-tv' });
                }

                // If BOTH variants are marked blur-tv, pass blur-tv tag
                if (isBiryaniBlurred && isPulaoBlurred) {
                    combinedTags.push({ id: 'tag-blur-tv', name: 'blur-tv' });
                }

                item = {
                    ...biryaniObj,
                    tags: { elements: combinedTags },
                    name: combinedName,
                    stemText: stemText ? `${stemText} ` : '',
                    biryaniText: biryaniText,
                    pulaoText: pulaoText,
                    isBiryaniAvail: isBiryaniAvail,
                    isPulaoAvail: isPulaoAvail,
                    isCombinedItem: true,
                    available: isCombinedAvail,
                    autoManage: false
                };
            }
        }

        result.push(item);
    }

    return result;
}

// Render the TVs menu boards
function renderTVMenu(items, allowedCategories = []) {
    currentTVItems = items;
    currentTVAllowedCategories = allowedCategories;

    const grid = document.getElementById('tv-menu-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // Filter out items belonging to hidden categories
    const hiddenCats = (config.hiddenCategories || []).map(c => c.toLowerCase());
    items = items.filter(item => {
        const itemCats = (item.categories && item.categories.elements) ? item.categories.elements.map(c => c.name.toLowerCase()) : [];
        // If ALL of an item's categories are hidden, exclude it
        return itemCats.some(cat => !hiddenCats.includes(cat));
    });

    // Also filter out hidden categories from the allowedCategories list
    allowedCategories = allowedCategories.filter(cat => !hiddenCats.includes(cat.toLowerCase()));

    if (items.length === 0) {
        const displayLabel = allowedCategories.length > 0 ? allowedCategories.join(', ') : 'Unmapped';
        grid.innerHTML = `
            <div class="empty-view-msg glass" style="grid-column: 1/-1; padding: 60px; text-align: center; border-radius: 20px; color: #000000; background: #ffffff; box-shadow: 0 10px 30px rgba(0,0,0,0.1); max-width: 600px; margin: 40px auto;">
                <p style="font-size: 1.6rem; font-weight: 800; margin-bottom: 12px; color: #ef4444;">No items found for this display</p>
                <p style="font-size: 1.05rem; color: #4b5563; margin-bottom: 24px; line-height: 1.6;">
                    This display is currently mapped to the category: <strong style="color: #000;">"${displayLabel}"</strong>.<br>
                    Make sure this category exists in your Clover inventory, contains active items, and is not turned off in the Category Visibility controls.
                </p>
                <button onclick="openSettingsModal()" style="padding: 12px 24px; font-weight: bold; background: #fbbf24; border: 1px solid #d97706; border-radius: 8px; cursor: pointer; font-size: 1rem; color: #000; transition: background 0.2s;">Open Connection Settings</button>
            </div>
        `;
        return;
    }

    // Dynamic Sizing calculation based on item count, screen ratio and orientation
    const orientation = config.orientation || 'portrait';
    const isRotated = orientation === 'rotate90' || orientation === 'rotate270';

    // Set custom CSS variables for orientation unit scaling
    document.documentElement.style.setProperty('--tv-unit-v', isRotated ? '1vw' : '1vh');
    document.documentElement.style.setProperty('--tv-unit-h', isRotated ? '1vh' : '1vw');

    // Visual dimensions of the screen layout
    const visualWidth = isRotated ? window.innerHeight : window.innerWidth;
    const visualHeight = isRotated ? window.innerWidth : window.innerHeight;

    // Calculate aspect ratio with manual overrides
    let aspectRatio = visualWidth / visualHeight;
    const ratioPreset = config.screenRatio || 'auto';
    if (ratioPreset === '16-9') {
        aspectRatio = 16 / 9;
    } else if (ratioPreset === '4-3') {
        aspectRatio = 4 / 3;
    } else if (ratioPreset === '21-9') {
        aspectRatio = 21 / 9;
    } else if (ratioPreset === '9-16') {
        aspectRatio = 9 / 16;
    }

    const itemsCount = items.length;
    let cols = 1;

    // Auto-optimize column count according to the display aspect ratio
    if (aspectRatio >= 1.5) {
        // Wide landscape screen (e.g. 16:9, 21:9)
        cols = itemsCount > 10 ? 3 : (itemsCount > 4 ? 2 : 1);
    } else if (aspectRatio >= 1.0) {
        // Square-ish landscape screen (e.g. 4:3, 1:1)
        cols = itemsCount > 6 ? 2 : 1;
    } else {
        // Portrait screen (tall display, aspect ratio < 1.0)
        // Use 2 columns earlier so long vertical menus fit better.
        cols = itemsCount > 8 ? 2 : 1;
    }

    // Standardized unified typography & spacing scale across all TV screens
    fontSizeVal = 2.45;
    gapVal = 0.28;
    paddingVal = 0.08;
    descFontSizeVal = fontSizeVal * 0.52;

    // Apply computed CSS custom properties to the grid using our custom variables
    grid.style.setProperty('--tv-cols', cols);
    grid.style.setProperty('--tv-font-size', `calc(${fontSizeVal.toFixed(2)} * var(--tv-unit-v))`);
    grid.style.setProperty('--tv-desc-font-size', `calc(${descFontSizeVal.toFixed(2)} * var(--tv-unit-v))`);
    grid.style.setProperty('--tv-gap', `calc(${gapVal.toFixed(2)} * var(--tv-unit-v))`);
    grid.style.setProperty('--tv-item-padding', `calc(${paddingVal.toFixed(2)} * var(--tv-unit-v))`);

    // Store raw values for dynamic auto-fitting calculations
    grid.style.setProperty('--tv-font-size-val', fontSizeVal.toFixed(2));
    grid.style.setProperty('--tv-desc-font-size-val', descFontSizeVal.toFixed(2));
    grid.style.setProperty('--tv-gap-val', gapVal.toFixed(2));
    grid.style.setProperty('--tv-item-padding-val', paddingVal.toFixed(2));

    // Group items by category and render in order of allowedCategories
    allowedCategories.forEach(catName => {
        let catItems = items.filter(item =>
            item.categories && item.categories.elements && item.categories.elements.some(c => c.name.toLowerCase() === catName.toLowerCase())
        );

        // Sort category items according to saved custom item arrangement order
        catItems = sortItemsByCustomOrder(catItems);

        // Combine Biryani & Pulao pairs into a single line
        catItems = combineBiryaniPulaoItems(catItems);

        if (catItems.length > 0) {
            // Add Category Header
            const firstItem = catItems[0];
            const actualCategory = firstItem.categories.elements.find(c => c.name.toLowerCase() === catName.toLowerCase());
            const displayCatName = actualCategory ? actualCategory.name : catName;

            const headerWrapper = document.createElement('h2');
            headerWrapper.className = 'menu-category-header';
            headerWrapper.innerText = displayCatName;
            grid.appendChild(headerWrapper);

            catItems.forEach(item => {
                const isHiddenOverride = item.tags && item.tags.elements && item.tags.elements.some(t => t.name === 'hidden-tv');
                if (isHiddenOverride) return; // Skip completely

                const isBlurredOverride = item.tags && item.tags.elements && item.tags.elements.some(t => t.name === 'blur-tv');
                const isPOSAvailable = item.isCombinedItem ? (item.available !== false) : (item.available !== false && (item.autoManage !== true || !item.itemStock || item.itemStock.quantity > 0));

                // Combined availability status
                const isAvailable = isPOSAvailable && !isBlurredOverride;

                // Determine Veg/Non-Veg status (based on img_0460 requirements)
                let isVeg = true;
                const nonVegKeywords = ['chicken', 'goat', 'lamb', 'shrimp', 'fish', 'egg', 'mutton', 'non-veg', 'non veg', 'meat', 'beef', 'pork', 'pulled', 'pulao (non-veg)'];
                const nameLower = item.name.toLowerCase();

                const hasNonVegKeyword = nonVegKeywords.some(kw => nameLower.includes(kw));
                const hasNonVegCat = item.categories && item.categories.elements && item.categories.elements.some(c =>
                    c.name.toLowerCase().includes('non-veg') || c.name.toLowerCase().includes('non veg')
                );

                if (hasNonVegKeyword || hasNonVegCat) {
                    isVeg = false;
                }

                // Exclude indicators for beverages/drinks
                const hasBeverageCat = item.categories && item.categories.elements && item.categories.elements.some(c =>
                    c.name.toLowerCase().includes('beverage') || c.name.toLowerCase().includes('drink') || c.name.toLowerCase().includes('water') || c.name.toLowerCase().includes('coffee') || c.name.toLowerCase().includes('lassi')
                );

                // Determine if item is in a category that should have indicators
                const shouldRenderIndicator = !hasBeverageCat;
                const indicatorHtml = shouldRenderIndicator ? `
                    <span class="diet-indicator ${isVeg ? 'veg' : 'non-veg'}">
                        <span class="diet-dot"></span>
                    </span>
                ` : '';

                // Create Card via Native DOM Elements
                const wrapper = document.createElement('div');
                wrapper.className = 'menu-item-row-wrapper';

                const rowDiv = document.createElement('div');
                rowDiv.className = `menu-item-row ${!isAvailable ? 'out-of-stock' : ''}`;

                const headerDiv = document.createElement('div');
                headerDiv.className = 'menu-item-header';

                const nameGroup = document.createElement('div');
                nameGroup.className = 'menu-item-name-group';

                if (shouldRenderIndicator) {
                    const indicatorSpan = document.createElement('span');
                    indicatorSpan.className = `diet-indicator ${isVeg ? 'veg' : 'non-veg'}`;
                    indicatorSpan.innerHTML = `<span class="diet-dot"></span>`;
                    nameGroup.appendChild(indicatorSpan);
                }

                const nameSpan = document.createElement('span');
                nameSpan.className = 'menu-item-name';

                if (item.isCombinedItem && (item.isBiryaniAvail !== item.isPulaoAvail)) {
                    const stemNode = document.createElement('span');
                    stemNode.textContent = item.stemText;
                    nameSpan.appendChild(stemNode);

                    if (!item.isBiryaniAvail) {
                        const blurNode = document.createElement('span');
                        blurNode.className = 'item-part-blurred';
                        blurNode.textContent = item.biryaniText;
                        nameSpan.appendChild(blurNode);

                        const activeNode = document.createElement('span');
                        activeNode.textContent = ' / ' + item.pulaoText;
                        nameSpan.appendChild(activeNode);
                    } else {
                        const activeNode = document.createElement('span');
                        activeNode.textContent = item.biryaniText + ' / ';
                        nameSpan.appendChild(activeNode);

                        const blurNode = document.createElement('span');
                        blurNode.className = 'item-part-blurred';
                        blurNode.textContent = item.pulaoText;
                        nameSpan.appendChild(blurNode);
                    }
                } else {
                    nameSpan.textContent = item.name;
                }

                nameGroup.appendChild(nameSpan);
                headerDiv.appendChild(nameGroup);

                const dotsSpan = document.createElement('span');
                dotsSpan.className = 'menu-item-dots';
                headerDiv.appendChild(dotsSpan);

                const priceSpan = document.createElement('span');
                priceSpan.className = 'menu-item-price';
                priceSpan.textContent = `$${(item.price / 100).toFixed(2)}`;
                headerDiv.appendChild(priceSpan);

                rowDiv.appendChild(headerDiv);

                if (!isAvailable) {
                    const soldBadge = document.createElement('div');
                    soldBadge.className = 'sold-out-badge';
                    soldBadge.textContent = 'SOLD OUT';
                    rowDiv.appendChild(soldBadge);
                }

                wrapper.appendChild(rowDiv);
                grid.appendChild(wrapper);
            });
        }
    });

    // Run dynamic layout optimizer to ensure content fits perfectly in the TV screen viewport
    adjustTVMenuLayout();
}

// Automatically scale down font size and padding to fit menu items within the TV screen viewport
function adjustTVMenuLayout() {
    const grid = document.getElementById('tv-menu-grid');
    const contentContainer = document.querySelector('.tv-content-container');
    if (!grid || !contentContainer) return;

    // Subtract a 50px safety buffer to prevent edge clipping near the footer
    const safeHeight = contentContainer.clientHeight - 50;

    let fontSize = parseFloat(grid.style.getPropertyValue('--tv-font-size-val') || '3.5');
    let descFontSize = parseFloat(grid.style.getPropertyValue('--tv-desc-font-size-val') || '1.8');
    let gap = parseFloat(grid.style.getPropertyValue('--tv-gap-val') || '2.0');
    let padding = parseFloat(grid.style.getPropertyValue('--tv-item-padding-val') || '0.5');

    let attempts = 0;
    // Keep reducing size incrementally as long as contentContainer scrollHeight exceeds safe height
    while (contentContainer.scrollHeight > safeHeight && fontSize > 0.8 && attempts < 40) {
        fontSize -= 0.08;
        descFontSize = fontSize * 0.52;
        gap = Math.max(0.5, gap - 0.08);
        padding = Math.max(0.12, padding - 0.02);

        grid.style.setProperty('--tv-font-size', `calc(${fontSize.toFixed(2)} * var(--tv-unit-v))`);
        grid.style.setProperty('--tv-desc-font-size', `calc(${descFontSize.toFixed(2)} * var(--tv-unit-v))`);
        grid.style.setProperty('--tv-gap', `calc(${gap.toFixed(2)} * var(--tv-unit-v))`);
        grid.style.setProperty('--tv-item-padding', `calc(${padding.toFixed(2)} * var(--tv-unit-v))`);

        grid.style.setProperty('--tv-font-size-val', fontSize.toFixed(2));
        grid.style.setProperty('--tv-desc-font-size-val', descFontSize.toFixed(2));
        grid.style.setProperty('--tv-gap-val', gap.toFixed(2));
        grid.style.setProperty('--tv-item-padding-val', padding.toFixed(2));

        attempts++;
    }
}

// Helper to get fallback image based on item category and name
function getItemImageFallback(item) {
    const categories = (item.categories && item.categories.elements) ? item.categories.elements.map(c => c.name.toLowerCase()) : [];
    const name = (item.name || '').toLowerCase();

    if (categories.some(c => c.includes('beverage') || c.includes('drink')) || name.includes('pepsi') || name.includes('lemonade') || name.includes('drink') || name.includes('tea') || name.includes('water')) {
        return 'assets/drink.png';
    }
    if (categories.some(c => c.includes('dessert') || c.includes('special') || c.includes('sweet') || c.includes('desserts')) || name.includes('cake') || name.includes('ice cream') || name.includes('dessert') || name.includes('sweet')) {
        return 'assets/dessert.png';
    }
    if (name.includes('pizza') || name.includes('bread') || name.includes('dosa') || name.includes('bonda') || name.includes('roast') || name.includes('fries') || name.includes('appetizer')) {
        return 'assets/pizza.png';
    }
    return 'assets/burger.png';
}

// Helper to get saved custom item ordering array from localStorage
function getItemCustomOrder() {
    try {
        return JSON.parse(localStorage.getItem('clover_menu_custom_item_order') || '[]');
    } catch (e) {
        return [];
    }
}

// Helper to save custom item ordering array to localStorage
function saveItemCustomOrder(orderArray) {
    localStorage.setItem('clover_menu_custom_item_order', JSON.stringify(orderArray));
}

// Sort item array according to saved custom item order
function sortItemsByCustomOrder(items) {
    if (!items || !Array.isArray(items)) return items;
    const customOrder = getItemCustomOrder();
    if (customOrder.length === 0) return items;

    return [...items].sort((a, b) => {
        const idxA = customOrder.indexOf(a.id);
        const idxB = customOrder.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
    });
}

// Move item position up or down in custom order
function moveItemInCustomOrder(itemId, direction, currentList) {
    let order = getItemCustomOrder();
    
    // If order list doesn't contain current items yet, populate it in current list sequence
    currentList.forEach(item => {
        if (!order.includes(item.id)) {
            order.push(item.id);
        }
    });

    const currentIndex = order.indexOf(itemId);
    if (currentIndex === -1) return;

    if (direction === 'up' && currentIndex > 0) {
        // Swap with previous item
        const temp = order[currentIndex - 1];
        order[currentIndex - 1] = order[currentIndex];
        order[currentIndex] = temp;
    } else if (direction === 'down' && currentIndex < order.length - 1) {
        // Swap with next item
        const temp = order[currentIndex + 1];
        order[currentIndex + 1] = order[currentIndex];
        order[currentIndex] = temp;
    }

    saveItemCustomOrder(order);
}

// Render Admin Panel list
function renderAdminList(categoryFilter = 'all') {
    const list = document.getElementById('admin-inventory-list');
    if (!list) return;
    list.innerHTML = '';

    // Filter items based on active category tab
    let filteredItems = inventoryData.filter(item => {
        if (categoryFilter === 'all') return true;

        // categoryFilter is now an actual category name (e.g. "Beverages")
        return item.categories && item.categories.elements && item.categories.elements.some(c => c.name.toLowerCase() === categoryFilter.toLowerCase());
    });

    // Sort items by custom arrangement order
    filteredItems = sortItemsByCustomOrder(filteredItems);

    // Apply search query filter (searches by name or category name)
    if (adminSearchQuery) {
        const q = adminSearchQuery.toLowerCase();
        filteredItems = filteredItems.filter(item => {
            if (item.name && item.name.toLowerCase().includes(q)) return true;
            if (item.categories && item.categories.elements) {
                return item.categories.elements.some(c => c.name && c.name.toLowerCase().includes(q));
            }
            return false;
        });
    }

    if (filteredItems.length === 0) {
        list.innerHTML = `
            <div style="padding: 40px; text-align: center; color: var(--color-text-dim);">
                No items found for this category. Go to Connection Settings to map categories.
            </div>
        `;
        return;
    }

    filteredItems.forEach((item, index) => {
        const isHidden = item.tags && item.tags.elements && item.tags.elements.some(t => t.name === 'hidden-tv');
        const isBlurred = item.tags && item.tags.elements && item.tags.elements.some(t => t.name === 'blur-tv');
        const isPOSAvailable = item.available !== false && (item.autoManage !== true || !item.itemStock || item.itemStock.quantity > 0);
        const itemStockQty = item.itemStock ? item.itemStock.quantity : 'Unlimited';

        // Categorization label
        const categoryLabels = (item.categories && item.categories.elements) ? item.categories.elements.map(c => `<span class="category-tag">${c.name}</span>`).join(' ') : '<span class="category-tag">Uncategorized</span>';

        const fallbackImg = getItemImageFallback(item);
        const itemImgSrc = item.imageUrl || fallbackImg;

        const row = document.createElement('div');
        row.className = 'admin-item-row';
        row.innerHTML = `
            <div class="admin-item-info">
                <div class="admin-item-visual">
                    <img src="${itemImgSrc}" alt="" onerror="this.src='${fallbackImg}'">
                </div>
                <div class="admin-item-details">
                    <h3>${item.name}</h3>
                    <div class="admin-item-meta">
                        <span>Price: $${(item.price / 100).toFixed(2)}</span>
                        <span>Stock: ${itemStockQty}</span>
                        ${categoryLabels}
                    </div>
                </div>
            </div>
            
            <div class="admin-item-pos-state">
                <span class="pos-pill ${isPOSAvailable ? 'available' : 'unavailable'}">
                    ${isPOSAvailable ? 'POS: Available' : 'POS: Out of Stock'}
                </span>
            </div>
            
            <div class="admin-item-actions">
                <div class="item-reorder-controls" style="display: flex; gap: 5px; margin-right: 10px;">
                    <button class="sort-arrow-btn move-item-btn" data-action="move-up" data-id="${item.id}" title="Move Up" ${index === 0 ? 'disabled' : ''}>▲</button>
                    <button class="sort-arrow-btn move-item-btn" data-action="move-down" data-id="${item.id}" title="Move Down" ${index === filteredItems.length - 1 ? 'disabled' : ''}>▼</button>
                </div>
                <button class="toggle-btn ${isHidden ? 'btn-disabled-state' : 'btn-active-state'}" data-action="toggle-hidden" data-id="${item.id}" data-active="${isHidden}">
                    ${isHidden ? '✕ Hidden on TV' : '✓ Showing on TV'}
                </button>
                <button class="toggle-btn ${isBlurred ? 'btn-disabled-state' : 'btn-active-state'}" data-action="toggle-blurred" data-id="${item.id}" data-active="${isBlurred}">
                    ${isBlurred ? '⚠ Blurred on TV (Sold Out)' : '✓ Stock Active on TV'}
                </button>
            </div>
        `;

        list.appendChild(row);
    });

    // Attach click events to item move buttons
    list.querySelectorAll('.move-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const btnEl = e.currentTarget;
            const itemId = btnEl.getAttribute('data-id');
            const action = btnEl.getAttribute('data-action');
            const direction = action === 'move-up' ? 'up' : 'down';

            moveItemInCustomOrder(itemId, direction, filteredItems);
            renderAdminList(categoryFilter);
            showToast('Item arrangement updated.', 'success');
        });
    });

    // Attach click events to toggles
    list.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const btnEl = e.currentTarget;
            const itemId = btnEl.getAttribute('data-id');
            const action = btnEl.getAttribute('data-action');
            const isCurrentlyActive = btnEl.getAttribute('data-active') === 'true';

            btnEl.disabled = true;
            btnEl.innerText = 'Updating...';

            let success = false;
            if (action === 'toggle-hidden') {
                success = await toggleCloverTag(itemId, 'hidden-tv', !isCurrentlyActive);
            } else if (action === 'toggle-blurred') {
                success = await toggleCloverTag(itemId, 'blur-tv', !isCurrentlyActive);
            }

            if (success) {
                renderAdminList(categoryFilter);
            } else {
                btnEl.disabled = false;
                btnEl.innerText = isCurrentlyActive ? 'Toggled' : 'Error';
            }
        });
    });
}

// Build dynamic admin nav tabs from actual inventory categories
function buildAdminNavTabs() {
    const navBar = document.getElementById('admin-nav-tabs');
    if (!navBar) return;

    // Gather unique category names from inventory
    const categories = new Set();
    inventoryData.forEach(item => {
        if (item.categories && item.categories.elements) {
            item.categories.elements.forEach(c => {
                if (c.name) categories.add(c.name);
            });
        }
    });

    // Keep the current active tab selection
    const activeTab = navBar.querySelector('.nav-tab.active');
    const activeCategory = activeTab ? activeTab.getAttribute('data-category') : 'all';

    // Rebuild tabs
    navBar.innerHTML = '';

    // "All Items" tab always first
    const allTab = document.createElement('button');
    allTab.className = `nav-tab ${activeCategory === 'all' ? 'active' : ''}`;
    allTab.setAttribute('data-category', 'all');
    allTab.innerText = 'All Items';
    navBar.appendChild(allTab);

    // Sort and add category tabs
    Array.from(categories).sort().forEach(catName => {
        const tab = document.createElement('button');
        tab.className = `nav-tab ${activeCategory === catName ? 'active' : ''}`;
        tab.setAttribute('data-category', catName);
        tab.innerText = catName;
        navBar.appendChild(tab);
    });

    // Attach click event listeners to new tabs
    navBar.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            navBar.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const categoryFilter = e.currentTarget.getAttribute('data-category');
            renderAdminList(categoryFilter);
        });
    });
}

// Render Category Toggle Chips for bulk show/hide
function renderCategoryToggles() {
    const grid = document.getElementById('category-toggles-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // Gather unique categories with item counts
    const categoryMap = {};
    inventoryData.forEach(item => {
        if (item.categories && item.categories.elements) {
            item.categories.elements.forEach(c => {
                if (c.name) {
                    categoryMap[c.name] = (categoryMap[c.name] || 0) + 1;
                }
            });
        }
    });

    const hiddenCats = (config.hiddenCategories || []).map(c => c.toLowerCase());

    // Sort and render chips
    Object.keys(categoryMap).sort().forEach(catName => {
        const isHidden = hiddenCats.includes(catName.toLowerCase());
        const count = categoryMap[catName];

        const chip = document.createElement('button');
        chip.className = `category-toggle-chip ${isHidden ? 'disabled' : 'active'}`;
        chip.setAttribute('data-category', catName);
        chip.innerHTML = `
            <span class="chip-icon">${isHidden ? '✕' : '✓'}</span>
            <span>${catName}</span>
            <span class="chip-count">${count} items</span>
        `;

        chip.addEventListener('click', () => toggleCategoryVisibility(catName));
        grid.appendChild(chip);
    });
}

// Toggle an entire category's visibility on TV screens
function toggleCategoryVisibility(catName) {
    const hiddenCats = config.hiddenCategories || [];
    const idx = hiddenCats.findIndex(c => c.toLowerCase() === catName.toLowerCase());

    if (idx >= 0) {
        // Currently hidden → show it
        hiddenCats.splice(idx, 1);
        showToast(`${catName} is now visible on TV screens.`, 'success');
    } else {
        // Currently visible → hide it
        hiddenCats.push(catName);
        showToast(`${catName} is now hidden from TV screens.`, 'error');
    }

    saveConfig({ hiddenCategories: hiddenCats });

    // Re-render the category toggles and admin list
    renderCategoryToggles();

    // Re-render admin list with current filter
    const activeTab = document.querySelector('#admin-nav-tabs .nav-tab.active');
    const activeCat = activeTab ? activeTab.getAttribute('data-category') : 'all';
    renderAdminList(activeCat);
}

// 4. ROUTER SYSTEM
function handleRouting() {
    // Hide all views
    document.querySelectorAll('.page-view').forEach(view => view.classList.add('hidden'));
    document.getElementById('floating-menu-controls').classList.add('hidden');

    // Parse page from query parameter (?page=screenX) or hash (#screenX)
    const params = new URLSearchParams(window.location.search);
    let page = params.get('page') || window.location.hash.replace('#', '');

    // If empty route, default launcher
    if (!page) {
        document.body.className = 'launcher-mode';
        document.getElementById('view-launcher').classList.remove('page-hidden', 'hidden');
        updateLauncherLabels();
        stopSyncTimer();
        return;
    }

    page = page.toLowerCase();

    if (page.startsWith('screen')) {
        // TV SCREEN DISPLAY VIEWS
        document.body.className = 'tv-mode';
        const view = document.getElementById('view-tv');
        view.classList.remove('hidden');
        document.getElementById('floating-menu-controls').classList.remove('hidden');

        // Use portrait layout by default for vertically mounted TV displays
        if (!['portrait', 'rotate90', 'rotate270'].includes(config.orientation)) {
            config.orientation = 'portrait';
        }

        // Establish screen mapping
        const categoryName = config.mappings[page] || 'Mains';

        const titleEl = document.getElementById('tv-screen-title');
        if (titleEl) titleEl.innerText = categoryName.toUpperCase();

        const subtitleEl = document.getElementById('tv-screen-subtitle');
        if (subtitleEl) subtitleEl.innerText = `Freshly prepared selection from our ${categoryName} menu.`;


        // Load data immediately and start timer
        refreshDisplayData(categoryName);
        startSyncTimer(categoryName);

    } else if (page === 'admin') {
        // ADMIN CONSOLE
        document.body.className = 'admin-mode';
        const view = document.getElementById('view-admin');
        view.classList.remove('hidden');
        document.getElementById('floating-menu-controls').classList.remove('hidden');

        // Load initial admin database
        refreshAdminData();
        startSyncTimer(null); // Simple refresh
    } else {
        // Fallback to launcher
        document.body.className = 'launcher-mode';
        document.getElementById('view-launcher').classList.remove('hidden');
        updateLauncherLabels();
        stopSyncTimer();
    }

    // Always re-apply orientation class since body.className overrides it above
    applyOrientationClass(config.orientation);
}

// Update text labels on the launcher buttons
function updateLauncherLabels() {
    document.getElementById('lbl-screen1').innerText = formatLauncherLabel(config.mappings.screen1) || 'Mains';
    document.getElementById('lbl-screen2').innerText = formatLauncherLabel(config.mappings.screen2) || 'Sides';
    document.getElementById('lbl-screen3').innerText = formatLauncherLabel(config.mappings.screen3) || 'Drinks';
    document.getElementById('lbl-screen4').innerText = formatLauncherLabel(config.mappings.screen4) || 'Specials';
}

function formatLauncherLabel(val) {
    if (!val) return '';
    if (val.length > 25) {
        return val.substring(0, 22) + '...';
    }
    return val;
}

// Start automatic data polling loops
function startSyncTimer(categoryName) {
    stopSyncTimer();

    // Enforce minimum refresh interval of 5 seconds to comply with Clover API rate limits
    const configuredSeconds = parseFloat(config.refreshInterval) || 10;
    const safeIntervalMs = Math.max(5, configuredSeconds) * 1000;

    refreshTimer = setInterval(async () => {
        if (categoryName) {
            await refreshDisplayData(categoryName, true);
        } else {
            await refreshAdminData(true);
        }
    }, safeIntervalMs);
}

function stopSyncTimer() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
}

// Pull data & update TV screens
async function refreshDisplayData(categoryName, isSilent = false) {
    try {
        await fetchCloverInventory();

        // Parse allowed categories (comma-separated list support)
        const allowedCategories = categoryName.split(',').map(c => c.trim().toLowerCase());

        // Filter items that belong to any of the allowed categories
        const filteredItems = inventoryData.filter(item =>
            item.categories && item.categories.elements && item.categories.elements.some(cat => allowedCategories.includes(cat.name.toLowerCase()))
        );

        renderTVMenu(filteredItems, allowedCategories);
    } catch (e) {
        console.error('Error refreshing display data:', e);
    }
}

// Pull data & update Admin lists
async function refreshAdminData(isSilent = false) {
    const statusDot = document.getElementById('admin-status-dot');
    const statusText = document.getElementById('admin-status-text');

    if (!isSilent) {
        statusDot.className = 'pulse-dot amber';
        statusText.innerText = 'Syncing...';
    }

    try {
        await fetchCloverInventory();

        // Build dynamic UI elements from live data
        buildAdminNavTabs();
        renderCategoryToggles();

        // Identify active tab
        const activeTab = document.querySelector('#admin-nav-tabs .nav-tab.active');
        const activeCat = activeTab ? activeTab.getAttribute('data-category') : 'all';

        renderAdminList(activeCat);

        statusDot.className = 'pulse-dot green';
        statusText.innerText = config.mode === 'demo' ? 'Demo Mode active' : 'Connected to Clover';
    } catch (e) {
        statusDot.className = 'pulse-dot red';
        statusText.innerText = 'Sync Error';
    }
}

// 5. MODAL CONFIGURATION PANELS
function openSettingsModal() {
    loadConfig();

    // Fill values
    const btnDemo = document.getElementById('btn-mode-demo');
    const btnLive = document.getElementById('btn-mode-live');
    const cloverSec = document.getElementById('clover-config-section');

    if (config.mode === 'live') {
        btnLive.classList.add('active');
        btnDemo.classList.remove('active');
        cloverSec.classList.remove('disabled-section');
        toggleCloverFields(false);
    } else {
        btnDemo.classList.add('active');
        btnLive.classList.remove('active');
        cloverSec.classList.add('disabled-section');
        toggleCloverFields(true);
    }

    document.getElementById('input-merchant-id').value = config.merchantId || '';
    document.getElementById('input-access-token').value = config.accessToken || '';
    document.getElementById('select-env').value = config.environment;
    document.getElementById('check-auto-tags').checked = config.autoTags;
    document.getElementById('input-refresh-rate').value = config.refreshInterval;
    document.getElementById('select-orientation').value = config.orientation || 'portrait';
    document.getElementById('select-ratio').value = config.screenRatio || 'auto';
    document.getElementById('btn-test-connection').disabled = config.mode !== 'live';

    // Populate dynamic Category checklists if available
    populateCategoryDropdowns();

    document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettingsModal() {
    document.getElementById('settings-modal').classList.add('hidden');
}

// Enable/Disable configuration fields
function toggleCloverFields(disable) {
    const merchantInput = document.getElementById('input-merchant-id');
    const tokenInput = document.getElementById('input-access-token');

    merchantInput.disabled = disable;
    tokenInput.disabled = disable;

    if (disable) {
        merchantInput.removeAttribute('required');
        tokenInput.removeAttribute('required');
    } else {
        merchantInput.setAttribute('required', '');
        tokenInput.setAttribute('required', '');
    }

    document.getElementById('select-env').disabled = disable;
    document.getElementById('check-auto-tags').disabled = disable;
    document.getElementById('btn-test-connection').disabled = disable;
}

// Populate Category checklists with unique categories
function populateCategoryDropdowns() {
    const categories = new Set();
    // Gather all categories from loaded dataset
    inventoryData.forEach(item => {
        if (item.categories && item.categories.elements) {
            item.categories.elements.forEach(c => {
                if (c.name) categories.add(c.name);
            });
        }
    });

    // Make sure our mapped categories exist in list
    Object.values(config.mappings).forEach(val => {
        if (val) {
            val.split(',').forEach(c => categories.add(c.trim()));
        }
    });

    // Build the list of all screens (fixed 1-4 + any extras)
    const baseScreens = ['screen1', 'screen2', 'screen3', 'screen4'];
    const extras = Array.from({length: extraScreenCount}, (_, i) => `screen${5 + i}`);
    const screens = [...baseScreens, ...extras];
    screens.forEach(screenKey => {
        const checklistContainer = document.getElementById(`map-${screenKey}-checklist`);
        if (!checklistContainer) return;

        const currentValue = config.mappings[screenKey] || '';
        // Mapped categories in their saved order
        const selectedCats = currentValue.split(',')
            .map(c => c.trim())
            .filter(c => c.length > 0);

        const selectedCatsLower = selectedCats.map(c => c.toLowerCase());

        checklistContainer.innerHTML = '';

        // 1. Add saved checked categories in their current order
        selectedCats.forEach(catName => {
            const originalName = Array.from(categories).find(c => c.toLowerCase() === catName.toLowerCase()) || catName;
            addChecklistItem(checklistContainer, originalName, true);
        });

        // 2. Add remaining unchecked categories alphabetically
        const uncheckedCats = Array.from(categories)
            .filter(c => !selectedCatsLower.includes(c.toLowerCase()))
            .sort();

        uncheckedCats.forEach(catName => {
            addChecklistItem(checklistContainer, catName, false);
        });
    });
}

// Helper to add checklist item with sorting controls
function addChecklistItem(container, catName, isChecked) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'category-checklist-item';
    itemDiv.innerHTML = `
        <div class="category-item-main">
            <label>
                <input type="checkbox" data-category="${catName}" ${isChecked ? 'checked' : ''} onchange="handleCategoryCheckChange(this)">
                <span>${catName}</span>
            </label>
        </div>
        <div class="category-item-sort-controls ${isChecked ? '' : 'hidden'}">
            <button type="button" class="sort-arrow-btn" onclick="moveCategoryItem(this, 'up')" title="Move Up">▲</button>
            <button type="button" class="sort-arrow-btn" onclick="moveCategoryItem(this, 'down')" title="Move Down">▼</button>
        </div>
    `;
    container.appendChild(itemDiv);
}

// Show/hide sorting arrows dynamically when checked/unchecked
function handleCategoryCheckChange(checkbox) {
    const itemRow = checkbox.closest('.category-checklist-item');
    const controls = itemRow.querySelector('.category-item-sort-controls');
    if (checkbox.checked) {
        controls.classList.remove('hidden');

        // Move checked item to the end of the current checked items group in DOM
        const parent = itemRow.parentNode;
        const unchecked = Array.from(parent.children).find(el => {
            const cb = el.querySelector('input[type="checkbox"]');
            return cb && !cb.checked;
        });
        if (unchecked) {
            parent.insertBefore(itemRow, unchecked);
        } else {
            parent.appendChild(itemRow);
        }
    } else {
        controls.classList.add('hidden');

        // Move unchecked item back to the bottom of the list
        const parent = itemRow.parentNode;
        parent.appendChild(itemRow);
    }
}

// Handle dynamic sorting in the DOM list
function moveCategoryItem(button, direction) {
    const itemRow = button.closest('.category-checklist-item');
    const parent = itemRow.parentNode;
    if (direction === 'up') {
        const prev = itemRow.previousElementSibling;
        if (prev) {
            const prevCheckbox = prev.querySelector('input[type="checkbox"]');
            if (prevCheckbox && prevCheckbox.checked) {
                parent.insertBefore(itemRow, prev);
            }
        }
    } else if (direction === 'down') {
        const next = itemRow.nextElementSibling;
        if (next) {
            const nextCheckbox = next.querySelector('input[type="checkbox"]');
            if (nextCheckbox && nextCheckbox.checked) {
                parent.insertBefore(next, itemRow);
            }
        }
    }
}

// Helper to gather selected checkboxes from checklist
function getCheckedCategories(checklistId) {
    const container = document.getElementById(checklistId);
    if (!container) return '';
    const checkedCheckboxes = container.querySelectorAll('input[type="checkbox"]:checked');
    const selected = Array.from(checkedCheckboxes).map(cb => cb.getAttribute('data-category'));
    return selected.join(', ');
}

// Handle Admin Panel settings form submit
async function handleSettingsSubmit(e) {
    e.preventDefault();

    const isLive = document.getElementById('btn-mode-live').classList.contains('active');

    const newConfig = {
        mode: isLive ? 'live' : 'demo',
        merchantId: document.getElementById('input-merchant-id').value.trim(),
        accessToken: document.getElementById('input-access-token').value.trim(),
        environment: document.getElementById('select-env').value,
        autoTags: document.getElementById('check-auto-tags').checked,
        refreshInterval: parseFloat(document.getElementById('input-refresh-rate').value) || 15,
        orientation: document.getElementById('select-orientation').value,
        screenRatio: document.getElementById('select-ratio').value,
        mappings: buildMappingsFromForm()
    };

    if (isLive && (!newConfig.merchantId || !newConfig.accessToken)) {
        showToast('Merchant ID and Access Token required for Live mode.', 'error');
        return;
    }

    // Temporarily apply config while validating live Clover credentials
    const previousConfig = { ...config };
    config = { ...config, ...newConfig };

    if (newConfig.mode === 'live') {
        try {
            showToast('Testing Clover connection...', 'success');
            await testCloverConnection();
        } catch (error) {
            config = previousConfig;
            console.error('Clover connection validation failed:', error);
            showToast('Clover connection failed. Check Merchant ID, Token, and environment.', 'error');
            return;
        }
    }

    saveConfig(newConfig);
    applyOrientationClass(newConfig.orientation);
    closeSettingsModal();
    showToast('Configuration Saved successfully.', 'success');

    // Reload active routes
    handleRouting();
}

async function handleTestConnectionClick() {
    const merchantId = document.getElementById('input-merchant-id').value.trim();
    const accessToken = document.getElementById('input-access-token').value.trim();
    const environment = document.getElementById('select-env').value;

    if (!merchantId || !accessToken) {
        showToast('Enter Merchant ID and Access Token before testing.', 'error');
        return;
    }

    const previousConfig = { ...config };
    config = { ...config, merchantId, accessToken, environment };

    try {
        showToast('Testing Clover connection...', 'success');
        await testCloverConnection();
        showToast('Clover connection verified successfully.', 'success');
    } catch (error) {
        console.error('Connection test failed:', error);
        showToast('Clover test failed. Confirm credentials and environment.', 'error');
    } finally {
        config = previousConfig;
    }
}

// Build mappings object from all form screens (fixed + extra)
function buildMappingsFromForm() {
    const mappings = {
        screen1: getCheckedCategories('map-screen1-checklist'),
        screen2: getCheckedCategories('map-screen2-checklist'),
        screen3: getCheckedCategories('map-screen3-checklist'),
        screen4: getCheckedCategories('map-screen4-checklist')
    };
    for (let i = 5; i <= 4 + extraScreenCount; i++) {
        mappings[`screen${i}`] = getCheckedCategories(`map-screen${i}-checklist`);
    }
    return mappings;
}

// Add a new extra screen slot to the settings modal
function addExtraScreen() {
    extraScreenCount++;
    const screenNum = 4 + extraScreenCount;
    const screenKey = `screen${screenNum}`;

    const container = document.getElementById('extra-screens-container');
    if (!container) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'form-grid extra-screen-row';
    wrapper.id = `extra-screen-row-${screenKey}`;
    wrapper.innerHTML = `
        <div class="form-group">
            <label>TV Screen ${screenNum}
                <button type="button" class="remove-screen-btn" onclick="removeExtraScreen('${screenKey}')" title="Remove this screen">✕ Remove</button>
            </label>
            <div class="category-checklist-container" id="map-${screenKey}-checklist"></div>
        </div>
    `;
    container.appendChild(wrapper);

    // Populate its checklist
    const categories = new Set();
    inventoryData.forEach(item => {
        if (item.categories && item.categories.elements) {
            item.categories.elements.forEach(c => { if (c.name) categories.add(c.name); });
        }
    });
    const checklistContainer = document.getElementById(`map-${screenKey}-checklist`);
    const currentValue = (config.mappings && config.mappings[screenKey]) || '';
    const selectedCats = currentValue.split(',').map(c => c.trim()).filter(c => c.length > 0);
    const selectedCatsLower = selectedCats.map(c => c.toLowerCase());

    selectedCats.forEach(catName => {
        const originalName = Array.from(categories).find(c => c.toLowerCase() === catName.toLowerCase()) || catName;
        addChecklistItem(checklistContainer, originalName, true);
    });
    Array.from(categories).filter(c => !selectedCatsLower.includes(c.toLowerCase())).sort().forEach(catName => {
        addChecklistItem(checklistContainer, catName, false);
    });

    showToast(`TV Screen ${screenNum} added.`, 'success');
}

// Remove an extra screen slot
function removeExtraScreen(screenKey) {
    const row = document.getElementById(`extra-screen-row-${screenKey}`);
    if (row) row.remove();
    extraScreenCount = Math.max(0, extraScreenCount - 1);
    // Renumber remaining extras in DOM to keep consistent
    // (we just remove from end for simplicity — gaps are handled by buildMappingsFromForm)
    showToast('Screen removed.', 'success');
}

// Restore extra screens from saved config when opening settings modal
function restoreExtraScreensFromConfig() {
    const container = document.getElementById('extra-screens-container');
    if (!container) return;
    container.innerHTML = '';
    extraScreenCount = 0;

    if (!config.mappings) return;

    let i = 5;
    while (config.mappings[`screen${i}`] !== undefined) {
        addExtraScreen();
        i++;
    }
}

// 6. UTILITY FUNCTIONS

// Custom Toast notification
function showToast(message, type = 'success') {
    // Check if toast already exists
    let toast = document.getElementById('ui-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'ui-toast';
        document.body.appendChild(toast);
    }

    // Set style rules inline on creation for ease
    toast.style.position = 'fixed';
    toast.style.bottom = '30px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    toast.style.padding = '14px 28px';
    toast.style.borderRadius = '30px';
    toast.style.fontSize = '0.95rem';
    toast.style.fontWeight = '600';
    toast.style.zIndex = '999';
    toast.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
    toast.style.opacity = '0';

    if (type === 'success') {
        toast.style.background = 'rgba(16, 185, 129, 0.95)';
        toast.style.border = '1px solid rgba(16, 185, 129, 0.2)';
        toast.style.color = '#ffffff';
    } else {
        toast.style.background = 'rgba(239, 68, 68, 0.95)';
        toast.style.border = '1px solid rgba(239, 68, 68, 0.2)';
        toast.style.color = '#ffffff';
    }

    toast.innerText = message;

    // Trigger animation
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
        toast.style.opacity = '1';
    }, 50);

    // Clear toast
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        toast.style.opacity = '0';
    }, 3000);
}

// Update running clock time
function updateClock() {
    const timeEl = document.getElementById('tv-footer-time');
    if (!timeEl) return;

    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12

    timeEl.innerText = `${hours}:${minutes} ${ampm}`;
}

// 7. INITIALIZATION AND EVENT LISTENERS
function init() {
    loadConfig();

    // Hash and Search listener for Routing
    window.addEventListener('hashchange', handleRouting);

    // Watch home/back triggers
    document.querySelectorAll('a[href="./"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            // Clear page param
            const url = new URL(window.location.href);
            url.searchParams.delete('page');
            window.location.hash = '';
            window.history.pushState({}, '', url.pathname);
            handleRouting();
        });
    });

    // Form settings toggles
    const btnDemo = document.getElementById('btn-mode-demo');
    const btnLive = document.getElementById('btn-mode-live');
    const cloverSec = document.getElementById('clover-config-section');

    btnDemo.addEventListener('click', () => {
        btnDemo.classList.add('active');
        btnLive.classList.remove('active');
        cloverSec.classList.add('disabled-section');
        toggleCloverFields(true);
        document.getElementById('btn-test-connection').disabled = true;
    });

    btnLive.addEventListener('click', () => {
        btnLive.classList.add('active');
        btnDemo.classList.remove('active');
        cloverSec.classList.remove('disabled-section');
        toggleCloverFields(false);
        document.getElementById('btn-test-connection').disabled = false;
    });

    // Modal click controllers
    document.getElementById('open-settings-btn').addEventListener('click', openSettingsModal);
    document.getElementById('float-settings-btn').addEventListener('click', openSettingsModal);
    document.getElementById('close-settings-btn').addEventListener('click', closeSettingsModal);
    document.getElementById('settings-form').addEventListener('submit', handleSettingsSubmit);
    document.getElementById('btn-test-connection').addEventListener('click', handleTestConnectionClick);

    // Add Screen button
    const addScreenBtn = document.getElementById('add-screen-btn');
    if (addScreenBtn) addScreenBtn.addEventListener('click', addExtraScreen);

    // Admin search bar
    const searchInput = document.getElementById('admin-search-input');
    const searchClear = document.getElementById('admin-search-clear');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            adminSearchQuery = searchInput.value.trim();
            searchClear.classList.toggle('hidden', adminSearchQuery === '');
            // Re-render with current active category tab
            const activeTab = document.querySelector('#admin-nav-tabs .nav-tab.active');
            const activeCat = activeTab ? activeTab.getAttribute('data-category') : 'all';
            renderAdminList(activeCat);
        });
    }
    if (searchClear) {
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            adminSearchQuery = '';
            searchClear.classList.add('hidden');
            const activeTab = document.querySelector('#admin-nav-tabs .nav-tab.active');
            const activeCat = activeTab ? activeTab.getAttribute('data-category') : 'all';
            renderAdminList(activeCat);
            searchInput.focus();
        });
    }

    // Note: Admin navigation tab click handlers are attached dynamically in buildAdminNavTabs()

    // Settings Modal close on overlay tap
    document.getElementById('settings-modal').addEventListener('click', (e) => {
        if (e.target.id === 'settings-modal') {
            closeSettingsModal();
        }
    });

    // Setup Footer clock updater
    setInterval(updateClock, 1000);
    updateClock();

    // Listen for localStorage changes from other tabs to sync immediately (instant tab sync)
    window.addEventListener('storage', (e) => {
        if (e.key === 'clover_menu_mock_inventory' || e.key === 'clover_menu_config') {
            loadConfig();
            handleRouting();
        }
    });

    // Recalculate and scale layout on window resize to ensure auto-optimization for new dimensions
    window.addEventListener('resize', () => {
        if (document.body.classList.contains('tv-mode') && currentTVItems.length > 0) {
            renderTVMenu(currentTVItems, currentTVAllowedCategories);
        }
    });

    // Trigger Router
    handleRouting();
}

// Fire application launch
document.addEventListener('DOMContentLoaded', init);
