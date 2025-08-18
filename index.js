// CAMPING BOT VANESSA - VERSION RÉORGANISÉE
const TelegramBot = require('node-telegram-bot-api');

const TOKEN = '8029829192:AAG6R2M5-0x5cZ48t-1NSCOBUYzYdanIWPA';
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwSkZJmQzgwiNVxKbF8TuAj5xU2fY4Na29wHtYxUBYJqMGLzfPZcJoNHcQndcU8yQKg/exec';
const PASSWORD = '123';

console.log('🏕️ Starting Camping Bot Vanessa...');

const cleanBot = new TelegramBot(TOKEN);
cleanBot.deleteWebHook().then(() => {
  console.log('✅ Webhooks cleaned');
  
  setTimeout(() => {
    const bot = new TelegramBot(TOKEN, {polling: true});
    console.log('🎉 Bot started successfully!');
    
    const userSessions = {};
    const authenticatedUsers = {};
    const colors = ['🔵 Blue', '🤎 Brown', '🔘 Grey', '🟠 Orange', '🟡 Yellow'];
    
    // Items de nettoyage par catégorie
    const cleaningItems = {
      kitchen: [
        'Draining Rack', 'Washing Up Bowl', 'Colander', 'Salad Bowl', 'Cheese Grater',
        'Glass Measurer', 'Chopping Board', 'Pan Small', 'Pan Medium', 'Pan Large',
        'Frying Pan', 'Kettle', 'Dinner Plates Beige Square', 'Dinner Plates White Round',
        'Dinner Plates Multicolor Blue/Yellow', 'Side Plates Beige Square', 'Side Plates White Round',
        'Side Plates Multicolor Blue/Yellow', 'Dessert Plates Beige Square', 'Dessert Plates White Round',
        'Dessert Plates Multicolor Blue/Yellow', 'Cereal Bowls Grey', 'Cereal Bowls Brown',
        'Cereal Bowls White', 'Mugs Grey', 'Mugs White', 'Mugs Brown', 'Mugs Blue',
        'Wine Glass', 'Tumblers', 'Cutlery Tray', 'Knives', 'Steak Knives',
        'Forks', 'Spoons', 'Tea Spoons', 'Serving Spoons', 'Ladle',
        'Kitchen Fork', 'Kitchen Spatula', 'Kitchen Tongs', 'Corkscrew',
        'Bread Knife', 'Veg Knife', 'Potato Peeler', 'Tin Opener',
        'Coffee Machine', 'Toaster'
      ],
      cleaning: [
        'Bin with Lid', 'Bucket', 'Mop', 'Mop Handle', 'Broom', 'Dustpan/Brush', 'Indoor Mat'
      ],
      bedding: [
        'Pillow', 'Double Duvets', 'Single Duvets', 'Double Mattress Cover', 'Single Mattress Cover'
      ],
      outdoor: [
        'Outside Table', 'Outside Chairs White', 'Outside Chairs Black', 'Outside Chairs Longue Black',
        'Clothes Rack', 'BBQ', 'BBQ Gas', 'BBQ Fork', 'BBQ Spatula', 'BBQ Tongs', 'Ashtray', 'Outdoor Mat'
      ],
      toilet: [
        'Toilet Brush'
      ]
    };
    
    // Variables pour stocker les données récupérées de Google Sheets
    let missingItemsData = {};
    let pendingRepairsData = {};
    let stockData = {};
    let maintenanceLogData = [];
    
    // Fonction pour récupérer les données depuis Google Sheets
    async function fetchDataFromGoogleSheets(dataType) {
      try {
        console.log(`📥 Fetching ${dataType} from Google Sheets...`);
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({action: 'getData', type: dataType})
        });
        const result = await response.json();
        console.log(`✅ Received ${dataType}:`, result.success);
        return result.data || {};
      } catch (error) {
        console.error(`❌ Error fetching ${dataType}:`, error);
        return {};
      }
    }
    
    // Fonction pour envoyer des mises à jour à Google Sheets
    async function sendToGoogleSheets(data) {
      try {
        console.log('📤 Sending to Google Sheets:', data.item);
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({action: 'addReport', ...data})
        });
        const result = await response.json();
        console.log('✅ Google Sheets response:', result.success);
        return result;
      } catch (error) {
        console.error('❌ Google Sheets error:', error);
        return { success: false, error: error.message };
      }
    }
    
    // Fonction pour charger les données initiales
    async function loadInitialData() {
      console.log('🔄 Loading initial data...');
      missingItemsData = await fetchDataFromGoogleSheets('missingItems');
      pendingRepairsData = await fetchDataFromGoogleSheets('pendingRepairs');
      stockData = await fetchDataFromGoogleSheets('stock');
      maintenanceLogData = await fetchDataFromGoogleSheets('maintenanceLog');
    }
    
    // Menu principal avec nettoyage de session
    function showMainMenu(chatId) {
      delete userSessions[chatId];
      
      bot.sendMessage(chatId, '🏠 *Main Menu*\n\nChoose your section:', {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [
            [{text: '🧹 Cleaning'}],
            [{text: '📦 Inventory'}],
            [{text: '🔧 Maintenance'}]
          ],
          one_time_keyboard: true,
          resize_keyboard: true
        }
      });
    }
    
    // Commandes principales
    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const userName = msg.from.first_name || 'User';
      
      delete userSessions[chatId];
      
      if (authenticatedUsers[chatId]) {
        showMainMenu(chatId);
        return;
      }
      
      userSessions[chatId] = {step: 'password'};
      bot.sendMessage(chatId, `🔐 Hello ${userName}!\n\nEnter password to access Camping Bot Vanessa:`);
    });
    
    bot.onText(/\/menu/, (msg) => {
      const chatId = msg.chat.id;
      
      if (!authenticatedUsers[chatId]) {
        bot.sendMessage(chatId, '🔐 Please use /start first to authenticate!');
        return;
      }
      
      showMainMenu(chatId);
    });
    
    // Handler principal des messages
    bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text;
      
      if (text && text.startsWith('/')) return;
      
      console.log(`📩 User ${chatId}: "${text}"`);
      
      const session = userSessions[chatId];
      
      // ÉTAPE 1: AUTHENTIFICATION
      if (session && session.step === 'password') {
        if (text === PASSWORD) {
          authenticatedUsers[chatId] = true;
          delete userSessions[chatId];
          bot.sendMessage(chatId, '✅ Access granted! Loading data...');
          
          // Charger les données après authentification
          await loadInitialData();
          
          setTimeout(() => showMainMenu(chatId), 1500);
        } else {
          bot.sendMessage(chatId, '❌ Wrong password! Try again:');
        }
        return;
      }
      
      if (!authenticatedUsers[chatId]) {
        bot.sendMessage(chatId, '🔐 Please use /start first to authenticate!');
        return;
      }
      
      // ÉTAPE 2: NAVIGATION PRINCIPALE
      if (!session) {
        if (text === '🧹 Cleaning') {
          userSessions[chatId] = {step: 'cleaning_color', section: 'cleaning'};
          
          const keyboard = colors.map(color => [{text: color}]);
          keyboard.push([{text: '🔙 Back to Menu'}]);
          
          bot.sendMessage(chatId, '🧹 *Cleaning Section*\n\n🎨 Choose bungalow color:', {
            parse_mode: 'Markdown',
            reply_markup: {
              keyboard: keyboard,
              one_time_keyboard: true,
              resize_keyboard: true
            }
          });
        } else if (text === '📦 Inventory') {
          userSessions[chatId] = {step: 'inventory_choice', section: 'inventory'};
          
          bot.sendMessage(chatId, '📦 *Inventory Section*\n\nChoose an action:', {
            parse_mode: 'Markdown',
            reply_markup: {
              keyboard: [
                [{text: '📦 Missing Items List'}],
                [{text: '📊 Check Stock'}],
                [{text: '🔄 Refresh Data'}],
                [{text: '🔙 Back to Menu'}]
              ],
              one_time_keyboard: true,
              resize_keyboard: true
            }
          });
        } else if (text === '🔧 Maintenance') {
          userSessions[chatId] = {step: 'maintenance_choice', section: 'maintenance'};
          
          bot.sendMessage(chatId, '🔧 *Maintenance Section*\n\nChoose an action:', {
            parse_mode: 'Markdown',
            reply_markup: {
              keyboard: [
                [{text: '🔧 Pending Repairs'}],
                [{text: '➕ Report New Issue'}],
                [{text: '📊 Maintenance Log'}],
                [{text: '🔄 Refresh Data'}],
                [{text: '🔙 Back to Menu'}]
              ],
              one_time_keyboard: true,
              resize_keyboard: true
            }
          });
        } else {
          bot.sendMessage(chatId, `❓ Please use the menu buttons or type /menu`);
        }
        return;
      }
      
      // ÉTAPE 3: GESTION DES SESSIONS ACTIVES
      if (session) {
        // Retour global au menu
        if (text === '🔙 Back to Menu') {
          showMainMenu(chatId);
          return;
        }
        
        // Refresh data global
        if (text === '🔄 Refresh Data') {
          bot.sendMessage(chatId, '🔄 Refreshing data from Google Sheets...');
          await loadInitialData();
          bot.sendMessage(chatId, '✅ Data refreshed! You can continue.');
          return;
        }
        
        // SECTION CLEANING
        if (session.section === 'cleaning') {
          if (session.step === 'cleaning_color') {
            if (colors.includes(text)) {
              session.selectedColor = text;
              session.step = 'cleaning_number';
              
              bot.sendMessage(chatId, `🔢 Enter bungalow number for ${text}:\n\n(Example: 1, 20, 15...)`, {
                reply_markup: {
                  keyboard: [[{text: '🔙 Back to Menu'}]],
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            } else {
              bot.sendMessage(chatId, '❌ Please choose a color from the list!');
            }
          } else if (session.step === 'cleaning_number') {
            const number = parseInt(text);
            if (number && number > 0) {
              session.bungalow = `${session.selectedColor} ${number}`;
              session.items = [];
              session.step = 'cleaning_action';
              
              bot.sendMessage(chatId, `✅ Bungalow: ${session.bungalow}\n\n🎯 Choose action:`, {
                reply_markup: {
                  keyboard: [
                    [{text: '🏠 Bungalow Ready'}],
                    [{text: '🔧 Maintenance Required'}],
                    [{text: '📦 Missing Items'}],
                    [{text: '🔙 Back to Menu'}]
                  ],
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            } else {
              bot.sendMessage(chatId, '❌ Enter a valid number (ex: 1, 20, 15...)');
            }
          } else if (session.step === 'cleaning_action') {
            if (text === '🏠 Bungalow Ready') {
              // ENVOI À GOOGLE SHEETS: Bungalow prêt
              await sendToGoogleSheets({
                bungalow: session.bungalow,
                item: 'Bungalow Ready',
                quantity: 1,
                category: 'status',
                notes: 'Cleaning completed, bungalow ready for guests',
                priority: 'normal',
                reportedBy: msg.from.first_name || 'User',
                section: 'cleaning',
                timestamp: new Date().toISOString()
              });
              
              bot.sendMessage(chatId, `🎉 *Bungalow Ready!*\n\n🏠 ${session.bungalow} is ready for guests\n✅ Status updated in system\n\n/menu to return`, {
                parse_mode: 'Markdown',
                reply_markup: {remove_keyboard: true}
              });
              delete userSessions[chatId];
            } else if (text === '🔧 Maintenance Required') {
              // ENVOI À GOOGLE SHEETS: Maintenance requise
              await sendToGoogleSheets({
                bungalow: session.bungalow,
                item: 'Maintenance Required',
                quantity: 1,
                category: 'maintenance',
                notes: 'Maintenance issue detected during cleaning',
                priority: 'high',
                reportedBy: msg.from.first_name || 'User',
                section: 'cleaning',
                timestamp: new Date().toISOString()
              });
              
              bot.sendMessage(chatId, `🔧 *Maintenance Reported!*\n\n🏠 ${session.bungalow} needs maintenance\n⚠️ Issue added to pending repairs\n\n/menu to return`, {
                parse_mode: 'Markdown',
                reply_markup: {remove_keyboard: true}
              });
              delete userSessions[chatId];
            } else if (text === '📦 Missing Items') {
              session.step = 'cleaning_category';
              
              bot.sendMessage(chatId, '📦 Choose category for missing items:', {
                reply_markup: {
                  keyboard: [
                    [{text: '🍽️ Kitchen'}],
                    [{text: '🏠 Outdoor'}],
                    [{text: '🧹 Cleaning'}],
                    [{text: '🛏️ Bedding'}],
                    [{text: '🚽 Toilet'}],
                    [{text: '🔙 Back to Menu'}]
                  ],
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            }
          } else if (session.step === 'cleaning_category') {
            let category = '';
            if (text === '🍽️ Kitchen') category = 'kitchen';
            else if (text === '🏠 Outdoor') category = 'outdoor';
            else if (text === '🧹 Cleaning') category = 'cleaning';
            else if (text === '🛏️ Bedding') category = 'bedding';
            else if (text === '🚽 Toilet') category = 'toilet';
            
            if (category) {
              session.selectedCategory = category;
              session.step = 'cleaning_item';
              
              const items = cleaningItems[category];
              const keyboard = items.map(item => [{text: item}]);
              keyboard.push([{text: '🔙 Back'}, {text: '🔙 Back to Menu'}]);
              
              bot.sendMessage(chatId, `Choose missing item (${text}):`, {
                reply_markup: {
                  keyboard: keyboard,
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            }
          } else if (session.step === 'cleaning_item') {
            if (text === '🔙 Back') {
              session.step = 'cleaning_category';
              
              bot.sendMessage(chatId, '📦 Choose category for missing items:', {
                reply_markup: {
                  keyboard: [
                    [{text: '🍽️ Kitchen'}],
                    [{text: '🏠 Outdoor'}],
                    [{text: '🧹 Cleaning'}],
                    [{text: '🛏️ Bedding'}],
                    [{text: '🚽 Toilet'}],
                    [{text: '🔙 Back to Menu'}]
                  ],
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
              return;
            }
            
            session.selectedItem = text;
            session.step = 'cleaning_quantity';
            
            bot.sendMessage(chatId, `📊 How many "${text}" are missing?\n\nEnter a number:`, {
              reply_markup: {
                keyboard: [[{text: '🔙 Back to Menu'}]],
                one_time_keyboard: true,
                resize_keyboard: true
              }
            });
          } else if (session.step === 'cleaning_quantity') {
            const quantity = parseInt(text);
            if (quantity && quantity > 0) {
              session.selectedQuantity = quantity;
              
              session.items.push({
                item: session.selectedItem,
                quantity: session.selectedQuantity,
                category: session.selectedCategory,
                notes: ''
              });
              
              session.step = 'cleaning_continue';
              
              const summary = session.items.map((item, index) => 
                `${index + 1}. ${item.item} x${item.quantity}`
              ).join('\n');
              
              bot.sendMessage(chatId, `✅ Item added!\n\n📋 *Summary ${session.bungalow}:*\n${summary}\n\nWhat do you want to do?`, {
                parse_mode: 'Markdown',
                reply_markup: {
                  keyboard: [
                    [{text: '➕ Add Another Item'}],
                    [{text: '📤 Send Report'}],
                    [{text: '🗑️ Cancel All'}],
                    [{text: '🔙 Back to Menu'}]
                  ],
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            } else {
              bot.sendMessage(chatId, '❌ Enter a valid number (ex: 1, 2, 3...)');
            }
          } else if (session.step === 'cleaning_continue') {
            if (text === '➕ Add Another Item') {
              session.step = 'cleaning_category';
              
              bot.sendMessage(chatId, '📦 Choose category for next item:', {
                reply_markup: {
                  keyboard: [
                    [{text: '🍽️ Kitchen'}],
                    [{text: '🏠 Outdoor'}],
                    [{text: '🧹 Cleaning'}],
                    [{text: '🛏️ Bedding'}],
                    [{text: '🚽 Toilet'}],
                    [{text: '🔙 Back to Menu'}]
                  ],
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            } else if (text === '📤 Send Report') {
              let successCount = 0;
              
              // ENVOI GROUPÉ À GOOGLE SHEETS: Tous les objets manquants
              for (const item of session.items) {
                try {
                  await sendToGoogleSheets({
                    bungalow: session.bungalow,
                    item: item.item,
                    quantity: item.quantity,
                    category: item.category,
                    notes: `Missing item reported during cleaning by ${msg.from.first_name}`,
                    priority: 'normal',
                    reportedBy: msg.from.first_name || 'User',
                    section: 'cleaning',
                    action: 'missing_item',
                    timestamp: new Date().toISOString()
                  });
                  successCount++;
                } catch (error) {
                  console.error('Send error:', error);
                }
              }
              
              const summary = session.items.map((item, index) => 
                `${index + 1}. ${item.item} x${item.quantity}`
              ).join('\n');
              
              bot.sendMessage(chatId, `🎉 *Missing Items Report Sent!*\n\n🏠 Bungalow: ${session.bungalow}\n📦 ${successCount} items reported:\n\n${summary}\n\n✅ All items added to inventory system\n\n/menu to return`, {
                parse_mode: 'Markdown',
                reply_markup: {remove_keyboard: true}
              });
              
              delete userSessions[chatId];
            } else if (text === '🗑️ Cancel All') {
              bot.sendMessage(chatId, '❌ Report cancelled. No data sent.\n\n/menu to return', {
                reply_markup: {remove_keyboard: true}
              });
              delete userSessions[chatId];
            }
          }
        } 
        
        // SECTION INVENTORY
        else if (session.section === 'inventory') {
          if (session.step === 'inventory_choice') {
            if (text === '📦 Missing Items List') {
              // RÉCUPÉRATION DEPUIS GOOGLE SHEETS: Liste des objets manquants
              const currentMissingItems = await fetchDataFromGoogleSheets('missingItems');
              
              if (Object.keys(currentMissingItems).length === 0) {
                bot.sendMessage(chatId, '✅ *No Missing Items!*\n\nAll bungalows have complete inventory.\n\n/menu to return', {
                  parse_mode: 'Markdown',
                  reply_markup: {remove_keyboard: true}
                });
                delete userSessions[chatId];
                return;
              }
              
              let missingText = '📋 *Current Missing Items*\n\n';
              
              Object.entries(currentMissingItems).forEach(([bungalow, items]) => {
                missingText += `${bungalow}:\n`;
                items.forEach(item => {
                  missingText += `• ${item.item} x${item.quantity}\n`;
                });
                missingText += '\n';
              });
              
              bot.sendMessage(chatId, missingText + '*Select "Supply Item" to mark items as provided*', {
                parse_mode: 'Markdown',
                reply_markup: {
                  keyboard: [
                    [{text: '📦 Supply Item'}],
                    [{text: '🔄 Refresh List'}],
                    [{text: '🔙 Back to Menu'}]
                  ],
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
              session.step = 'missing_items_list';
            } else if (text === '📊 Check Stock') {
              // RÉCUPÉRATION DEPUIS GOOGLE SHEETS: État des stocks
              const currentStock = await fetchDataFromGoogleSheets('stock');
              
              if (Object.keys(currentStock).length === 0) {
                bot.sendMessage(chatId, '📊 *Stock Data*\n\nNo stock data available. Please refresh data.\n\n/menu to return', {
                  parse_mode: 'Markdown',
                  reply_markup: {remove_keyboard: true}
                });
                delete userSessions[chatId];
                return;
              }
              
              let stockText = '📊 *Current Stock Status*\n\n';
              
              Object.entries(currentStock).forEach(([category, items]) => {
                stockText += `**${category}:**\n`;
                Object.entries(items).forEach(([item, quantity]) => {
                  const status = quantity > 5 ? '✅' : quantity > 2 ? '⚠️' : '❌';
                  stockText += `• ${item}: ${quantity} ${status}\n`;
                });
                stockText += '\n';
              });
              
              bot.sendMessage(chatId, stockText + '/menu to return', {
                parse_mode: 'Markdown',
                reply_markup: {remove_keyboard: true}
              });
              delete userSessions[chatId];
            }
          } else if (session.step === 'missing_items_list') {
            if (text === '🔄 Refresh List') {
              bot.sendMessage(chatId, '🔄 Refreshing missing items list...');
              
              // RÉCUPÉRATION MISE À JOUR DEPUIS GOOGLE SHEETS
              const updatedMissingItems = await fetchDataFromGoogleSheets('missingItems');
              missingItemsData = updatedMissingItems;
              
              if (Object.keys(updatedMissingItems).length === 0) {
                bot.sendMessage(chatId, '✅ *No Missing Items!*\n\nAll items have been supplied!\n\n/menu to return', {
                  parse_mode: 'Markdown',
                  reply_markup: {remove_keyboard: true}
                });
                delete userSessions[chatId];
                return;
              }
              
              let missingText = '📋 *Updated Missing Items*\n\n';
              
              Object.entries(updatedMissingItems).forEach(([bungalow, items]) => {
                missingText += `${bungalow}:\n`;
                items.forEach(item => {
                  missingText += `• ${item.item} x${item.quantity}\n`;
                });
                missingText += '\n';
              });
              
              bot.sendMessage(chatId, missingText + '*Select "Supply Item" to mark items as provided*', {
                parse_mode: 'Markdown',
                reply_markup: {
                  keyboard: [
                    [{text: '📦 Supply Item'}],
                    [{text: '🔄 Refresh List'}],
                    [{text: '🔙 Back to Menu'}]
                  ],
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            } else if (text === '📦 Supply Item') {
              session.step = 'supply_bungalow';
              
              const keyboard = Object.keys(missingItemsData).map(bungalow => [{text: bungalow}]);
              keyboard.push([{text: '🔙 Back'}, {text: '🔙 Back to Menu'}]);
              
              bot.sendMessage(chatId, '🏠 Which bungalow did you supply?', {
                reply_markup: {
                  keyboard: keyboard,
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            }
          } else if (session.step === 'supply_bungalow') {
            if (text === '🔙 Back') {
              session.step = 'missing_items_list';
              
              bot.sendMessage(chatId, `📋 *Missing Items List*\n\nSelect an option:`, {
                parse_mode: 'Markdown',
                reply_markup: {
                  keyboard: [
                    [{text: '🔄 Refresh List'}],
                    [{text: '📦 Supply Item'}],
                    [{text: '🔙 Back to Menu'}]
                  ],
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
              return;
            }
            
            if (missingItemsData[text]) {
              session.selectedBungalow = text;
              session.step = 'supply_item';
              
              const items = missingItemsData[text];
              const keyboard = items.map(item => [{text: `${item.item} x${item.quantity}`}]);
              keyboard.push([{text: '🔙 Back'}, {text: '🔙 Back to Menu'}]);
              
              bot.sendMessage(chatId, `📦 What did you supply to ${text}?`, {
                reply_markup: {
                  keyboard: keyboard,
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            }
          } else if (session.step === 'supply_item') {
            if (text === '🔙 Back') {
              session.step = 'supply_bungalow';
              
              const keyboard = Object.keys(missingItemsData).map(bungalow => [{text: bungalow}]);
              keyboard.push([{text: '🔙 Back'}, {text: '🔙 Back to Menu'}]);
              
              bot.sendMessage(chatId, '🏠 Which bungalow did you supply?', {
                reply_markup: {
                  keyboard: keyboard,
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
              return;
            }
            
            session.suppliedItem = text;
            session.step = 'supply_quantity';
            
            const match = text.match(/x(\d+)/);
            const totalMissing = match ? parseInt(match[1]) : 1;
            session.totalMissing = totalMissing;
            
            bot.sendMessage(chatId, `📦 ${text}\n\n📊 How many did you supply?\n\nTotal missing: ${totalMissing}\nEnter quantity (1-${totalMissing}):`, {
              reply_markup: {
                keyboard: [[{text: '🔙 Back to Menu'}]],
                one_time_keyboard: true,
                resize_keyboard: true
              }
            });
          } else if (session.step === 'supply_quantity') {
            const suppliedQty = parseInt(text);
            if (suppliedQty && suppliedQty > 0 && suppliedQty <= session.totalMissing) {
              const remaining = session.totalMissing - suppliedQty;
              const itemName = session.suppliedItem.replace(/x\d+/, '').trim();
              
              // ENVOI À GOOGLE SHEETS: Objet fourni
              await sendToGoogleSheets({
                bungalow: session.selectedBungalow,
                item: itemName,
                quantity: suppliedQty,
                category: 'supplied',
                notes: `Item supplied by ${msg.from.first_name}. Original missing: ${session.totalMissing}, Supplied: ${suppliedQty}, Remaining: ${remaining}`,
                priority: remaining > 0 ? 'partial' : 'completed',
                reportedBy: msg.from.first_name || 'User',
                section: 'inventory',
                action: 'item_supplied',
                timestamp: new Date().toISOString()
              });
              
              const statusMessage = remaining > 0 ? 
                `📊 ${remaining} ${itemName} still needed for this bungalow.` :
                `✨ All items supplied! This item has been removed from the missing items list.`;
              
              bot.sendMessage(chatId, `✅ *Supply Recorded Successfully!*\n\n🏠 Bungalow: ${session.selectedBungalow}\n📦 Item: ${itemName}\n📊 Quantity supplied: ${suppliedQty}\n\n${statusMessage}\n\n/menu to return`, {
                parse_mode: 'Markdown',
                reply_markup: {remove_keyboard: true}
              });
              delete userSessions[chatId];
            } else {
              bot.sendMessage(chatId, `❌ Enter a valid number between 1 and ${session.totalMissing}`);
            }
          }
        } 
        
        // SECTION MAINTENANCE
        else if (session.section === 'maintenance') {
          if (session.step === 'maintenance_choice') {
            if (text === '🔧 Pending Repairs') {
              // RÉCUPÉRATION DEPUIS GOOGLE SHEETS: Réparations en attente
              const currentPendingRepairs = await fetchDataFromGoogleSheets('pendingRepairs');
              
              if (Object.keys(currentPendingRepairs).length === 0) {
                bot.sendMessage(chatId, '✅ *No Pending Repairs!*\n\nAll maintenance issues have been resolved.\n\n/menu to return', {
                  parse_mode: 'Markdown',
                  reply_markup: {remove_keyboard: true}
                });
                delete userSessions[chatId];
                return;
              }
              
              let repairsText = '🔧 *Current Pending Repairs*\n\n';
              
              Object.entries(currentPendingRepairs).forEach(([bungalow, repairs]) => {
                repairsText += `${bungalow}:\n`;
                repairs.forEach(repair => {
                  const priorityIcon = repair.priority === 'urgent' ? '🚨' : 
                                     repair.priority === 'high' ? '⚡' : '🔧';
                  repairsText += `• ${priorityIcon} ${repair.priority}: ${repair.issue}\n`;
                });
                repairsText += '\n';
              });
              
              bot.sendMessage(chatId, repairsText + '*Select "Mark as Repaired" to complete repairs*', {
                parse_mode: 'Markdown',
                reply_markup: {
                  keyboard: [
                    [{text: '✅ Mark as Repaired'}],
                    [{text: '🔄 Refresh List'}],
                    [{text: '🔙 Back to Menu'}]
                  ],
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
              session.step = 'pending_repairs_list';
              pendingRepairsData = currentPendingRepairs;
            } else if (text === '➕ Report New Issue') {
              session.step = 'maintenance_color';
              
              const keyboard = colors.map(color => [{text: color}]);
              keyboard.push([{text: '🔙 Back to Menu'}]);
              
              bot.sendMessage(chatId, '🔧 *Report New Issue*\n\n🎨 Choose bungalow color:', {
                parse_mode: 'Markdown',
                reply_markup: {
                  keyboard: keyboard,
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            } else if (text === '📊 Maintenance Log') {
              // RÉCUPÉRATION DEPUIS GOOGLE SHEETS: Journal de maintenance
              const currentMaintenanceLog = await fetchDataFromGoogleSheets('maintenanceLog');
              
              if (currentMaintenanceLog.length === 0) {
                bot.sendMessage(chatId, '📊 *Maintenance Log*\n\nNo maintenance history available.\n\n/menu to return', {
                  parse_mode: 'Markdown',
                  reply_markup: {remove_keyboard: true}
                });
                delete userSessions[chatId];
                return;
              }
              
              let logText = '📊 *Maintenance Log*\n\n';
              logText += '✅ **Recently Completed:**\n';
              
              currentMaintenanceLog.slice(-10).forEach(entry => {
                const date = new Date(entry.timestamp).toLocaleDateString();
                logText += `• ${entry.bungalow} - ${entry.item} (${date})\n`;
              });
              
              bot.sendMessage(chatId, logText + '\n/menu to return', {
                parse_mode: 'Markdown',
                reply_markup: {remove_keyboard: true}
              });
              delete userSessions[chatId];
            }
          } else if (session.step === 'pending_repairs_list') {
            if (text === '🔄 Refresh List') {
              bot.sendMessage(chatId, '🔄 Refreshing repairs list...');
              
              // RÉCUPÉRATION MISE À JOUR DEPUIS GOOGLE SHEETS
              const updatedPendingRepairs = await fetchDataFromGoogleSheets('pendingRepairs');
              pendingRepairsData = updatedPendingRepairs;
              
              if (Object.keys(updatedPendingRepairs).length === 0) {
                bot.sendMessage(chatId, '✅ *No Pending Repairs!*\n\nAll issues resolved!\n\n/menu to return', {
                  parse_mode: 'Markdown',
                  reply_markup: {remove_keyboard: true}
                });
                delete userSessions[chatId];
                return;
              }
              
              let repairsText = '🔧 *Updated Pending Repairs*\n\n';
              
              Object.entries(updatedPendingRepairs).forEach(([bungalow, repairs]) => {
                repairsText += `${bungalow}:\n`;
                repairs.forEach(repair => {
                  const priorityIcon = repair.priority === 'urgent' ? '🚨' : 
                                     repair.priority === 'high' ? '⚡' : '🔧';
                  repairsText += `• ${priorityIcon} ${repair.priority}: ${repair.issue}\n`;
                });
                repairsText += '\n';
              });
              
              bot.sendMessage(chatId, repairsText + '*Select "Mark as Repaired" to complete repairs*', {
                parse_mode: 'Markdown',
                reply_markup: {
                  keyboard: [
                    [{text: '✅ Mark as Repaired'}],
                    [{text: '🔄 Refresh List'}],
                    [{text: '🔙 Back to Menu'}]
                  ],
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            } else if (text === '✅ Mark as Repaired') {
              session.step = 'repair_bungalow';
              
              const keyboard = Object.keys(pendingRepairsData).map(bungalow => [{text: bungalow}]);
              keyboard.push([{text: '🔙 Back'}, {text: '🔙 Back to Menu'}]);
              
              bot.sendMessage(chatId, '🏠 Which bungalow did you repair?', {
                reply_markup: {
                  keyboard: keyboard,
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            }
          } else if (session.step === 'repair_bungalow') {
            if (text === '🔙 Back') {
              session.step = 'pending_repairs_list';
              
              bot.sendMessage(chatId, `🔧 *Pending Maintenance Issues*\n\nSelect an option:`, {
                parse_mode: 'Markdown',
                reply_markup: {
                  keyboard: [
                    [{text: '🔄 Refresh List'}],
                    [{text: '✅ Mark as Repaired'}],
                    [{text: '🔙 Back to Menu'}]
                  ],
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
              return;
            }
            
            if (pendingRepairsData[text]) {
              session.selectedBungalow = text;
              session.step = 'repair_issue';
              
              const repairs = pendingRepairsData[text];
              const keyboard = repairs.map(repair => [{text: repair.issue}]);
              keyboard.push([{text: '🔙 Back'}, {text: '🔙 Back to Menu'}]);
              
              bot.sendMessage(chatId, `🔧 What did you repair in ${text}?`, {
                reply_markup: {
                  keyboard: keyboard,
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            }
          } else if (session.step === 'repair_issue') {
            if (text === '🔙 Back') {
              session.step = 'repair_bungalow';
              
              const keyboard = Object.keys(pendingRepairsData).map(bungalow => [{text: bungalow}]);
              keyboard.push([{text: '🔙 Back'}, {text: '🔙 Back to Menu'}]);
              
              bot.sendMessage(chatId, '🏠 Which bungalow did you repair?', {
                reply_markup: {
                  keyboard: keyboard,
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
              return;
            }
            
            session.repairedIssue = text;
            
            // ENVOI À GOOGLE SHEETS: Réparation terminée
            await sendToGoogleSheets({
              bungalow: session.selectedBungalow,
              item: session.repairedIssue,
              quantity: 1,
              category: 'maintenance',
              notes: `Repair completed by ${msg.from.first_name}`,
              priority: 'completed',
              reportedBy: msg.from.first_name || 'User',
              section: 'maintenance',
              action: 'repair_completed',
              timestamp: new Date().toISOString()
            });
            
            bot.sendMessage(chatId, `✅ *Repair Completed Successfully!*\n\n🏠 Bungalow: ${session.selectedBungalow}\n🔧 Issue: ${session.repairedIssue}\n\n✨ This issue has been removed from pending repairs and added to maintenance log.\n\n/menu to return`, {
              parse_mode: 'Markdown',
              reply_markup: {remove_keyboard: true}
            });
            delete userSessions[chatId];
          } else if (session.step === 'maintenance_color') {
            if (colors.includes(text)) {
              session.selectedColor = text;
              session.step = 'maintenance_number';
              
              bot.sendMessage(chatId, `🔢 Enter bungalow number for ${text}:\n\n(Ex: 1, 20, 15...)`, {
                reply_markup: {
                  keyboard: [[{text: '🔙 Back to Menu'}]],
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            } else {
              bot.sendMessage(chatId, '❌ Please choose a color from the list!');
            }
          } else if (session.step === 'maintenance_number') {
            const number = parseInt(text);
            if (number && number > 0) {
              session.bungalow = `${session.selectedColor} ${number}`;
              session.step = 'maintenance_type';
              
              bot.sendMessage(chatId, `🔧 Bungalow: ${session.bungalow}\n\nType of problem:`, {
                reply_markup: {
                  keyboard: [
                    [{text: '🚨 Urgent Repair'}],
                    [{text: '⚡ Electrical Issue'}],
                    [{text: '🚿 Plumbing Issue'}],
                    [{text: '🚪 Door/Window Issue'}],
                    [{text: '🧹 Special Cleaning'}],
                    [{text: '🔙 Back to Menu'}]
                  ],
                  one_time_keyboard: true,
                  resize_keyboard: true
                }
              });
            } else {
              bot.sendMessage(chatId, '❌ Enter a valid number (ex: 1, 20, 15...)');
            }
          } else if (session.step === 'maintenance_type') {
            session.selectedType = text;
            session.step = 'maintenance_description';
            
            bot.sendMessage(chatId, `📝 Describe the problem in detail:\n\n(Or type "skip" to skip description)`, {
              reply_markup: {
                keyboard: [[{text: 'skip'}, {text: '🔙 Back to Menu'}]],
                one_time_keyboard: true,
                resize_keyboard: true
              }
            });
          } else if (session.step === 'maintenance_description') {
            const description = text === 'skip' ? '' : text;
            
            let priority = 'normal';
            if (session.selectedType.includes('Urgent')) {
              priority = 'urgent';
            } else if (session.selectedType.includes('Electrical') || 
                       session.selectedType.includes('Plumbing')) {
              priority = 'high';
            }
            
            // ENVOI À GOOGLE SHEETS: Nouveau problème signalé
            await sendToGoogleSheets({
              bungalow: session.bungalow,
              item: session.selectedType,
              quantity: 1,
              category: 'maintenance',
              notes: description,
              priority: priority,
              reportedBy: msg.from.first_name || 'User',
              section: 'maintenance',
              action: 'new_issue',
              timestamp: new Date().toISOString()
            });
            
            bot.sendMessage(chatId, `🔧 *New Issue Reported!*\n\n🏠 Bungalow: ${session.bungalow}\n🔧 Type: ${session.selectedType}\n📝 Description: ${description || 'None'}\n⚠️ Priority: ${priority}\n\n✨ This issue has been added to pending repairs list.\n\n/menu to return`, {
              parse_mode: 'Markdown',
              reply_markup: {remove_keyboard: true}
            });
            delete userSessions[chatId];
          }
        }
      }
    });
    
    // Gestion des erreurs
    bot.on('error', (error) => {
      console.error('Bot error:', error);
    });
    
    bot.on('polling_error', (error) => {
      console.error('Polling error:', error);
    });
    
    // Charger les données initiales au démarrage (données de démonstration)
    console.log('📚 Loading demo data...');
    
    // Données de démonstration (remplacées par les vraies données après authentification)
    missingItemsData = {
      '🔵 Blue 15': [
        {item: 'Mugs Grey', quantity: 2}, 
        {item: 'Frying Pan', quantity: 1}
      ],
      '🟠 Orange 7': [
        {item: 'Toilet Brush', quantity: 1}, 
        {item: 'Pillow', quantity: 1}
      ],
      '🤎 Brown 22': [
        {item: 'Spoons', quantity: 4}, 
        {item: 'BBQ Gas', quantity: 1}
      ]
    };
    
    pendingRepairsData = {
      '🔵 Blue 8': [
        {issue: 'Door lock broken', priority: 'urgent'}, 
        {issue: 'Electrical outlet not working', priority: 'high'}
      ],
      '🟠 Orange 15': [
        {issue: 'Shower head leaking', priority: 'high'}
      ],
      '🤎 Brown 3': [
        {issue: 'Window won\'t close', priority: 'urgent'}
      ]
    };
    
    stockData = {
      'Kitchen': {
        'Mugs Grey': 12,
        'Mugs White': 3,
        'Mugs Brown': 8,
        'Dinner Plates Beige': 6,
        'Frying Pan': 4
      },
      'Outdoor': {
        'Outside Chairs White': 8,
        'Outside Chairs Black': 5,
        'BBQ Fork': 2,
        'BBQ Gas': 3
      }
    };
    
    maintenanceLogData = [
      {
        bungalow: '🔵 Blue 12',
        item: 'Electrical fixed',
        timestamp: '2025-08-15T10:30:00Z',
        reportedBy: 'Staff'
      },
      {
        bungalow: '🟠 Orange 5',
        item: 'Plumbing repaired',
        timestamp: '2025-08-14T14:20:00Z',
        reportedBy: 'Maintenance'
      },
      {
        bungalow: '🤎 Brown 18',
        item: 'Door handle fixed',
        timestamp: '2025-08-13T09:15:00Z',
        reportedBy: 'Staff'
      }
    ];
    
    console.log('✅ Demo data loaded');
    
  }, 2000);
  
}).catch((error) => {
  console.error('❌ Cleanup error:', error);
});
