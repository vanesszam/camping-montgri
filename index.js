// CAMPING BOT VANESSA - VERSION CORRIGÉE
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
    
    // Données mock pour démonstration
    const mockMissingItems = {
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
    
    const mockPendingRepairs = {
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
    
    // Fonction pour envoyer à Google Sheets
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
      bot.sendMessage(chatId, `🔐 Hello ${userName}!\n\nEnter password:`);
    });
    
    bot.onText(/\/menu/, (msg) => {
      const chatId = msg.chat.id;
      
      if (!authenticatedUsers[chatId]) {
        bot.sendMessage(chatId, '🔐 Please use /start first!');
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
      
      // Étape password
      if (session && session.step === 'password') {
        if (text === PASSWORD) {
          authenticatedUsers[chatId] = true;
          delete userSessions[chatId];
          bot.sendMessage(chatId, '✅ Access granted!');
          setTimeout(() => showMainMenu(chatId), 1000);
        } else {
          bot.sendMessage(chatId, '❌ Wrong password! Try again:');
        }
        return;
      }
      
      if (!authenticatedUsers[chatId]) {
        bot.sendMessage(chatId, '🔐 Please use /start first!');
        return;
      }
      
      // Menu principal (pas de session active)
      if (!session) {
        if (text === '🧹 Cleaning') {
          userSessions[chatId] = {step: 'cleaning_color', section: 'cleaning'};
          
          const keyboard = colors.map(color => [{text: color}]);
          keyboard.push([{text: '🔙 Back to Menu'}]);
          
          bot.sendMessage(chatId, '🎨 Choose bungalow color:', {
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
                [{text: '🔙 Back to Menu'}]
              ],
              one_time_keyboard: true,
              resize_keyboard: true
            }
          });
        } else {
          bot.sendMessage(chatId, `❓ Use menu buttons or /menu`);
        }
        return;
      }
      
      // Sessions actives avec gestion globale du retour
      if (session) {
        if (text === '🔙 Back to Menu') {
          showMainMenu(chatId);
          return;
        }
        
        // Section Cleaning
        if (session.section === 'cleaning') {
          if (session.step === 'cleaning_color') {
            if (colors.includes(text)) {
              session.selectedColor = text;
              session.step = 'pending_repairs_list';
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
              bot.sendMessage(chatId, `📊 *Maintenance Log*\n\n✅ **Recently Completed:**\n• 🔵 Blue 12 - Electrical fixed\n• 🟠 Orange 5 - Plumbing repaired\n• 🤎 Brown 18 - Door handle fixed\n\n⏳ **In Progress:**\n• 🟡 Yellow 9 - BBQ repair\n• 🔘 Grey 14 - Shower head replacement\n\n/menu to return`, {
                parse_mode: 'Markdown',
                reply_markup: {remove_keyboard: true}
              });
              delete userSessions[chatId];
            }
          } else if (session.step === 'pending_repairs_list') {
            if (text === '🔄 Refresh List') {
              let repairsText = '🔧 *Current Pending Repairs*\n\n';
              
              Object.entries(mockPendingRepairs).forEach(([bungalow, repairs]) => {
                repairsText += `${bungalow}:\n`;
                repairs.forEach(repair => {
                  const priorityIcon = repair.priority === 'urgent' ? '🔧' : 
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
              
              const keyboard = Object.keys(mockPendingRepairs).map(bungalow => [{text: bungalow}]);
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
            
            if (mockPendingRepairs[text]) {
              session.selectedBungalow = text;
              session.step = 'repair_issue';
              
              const repairs = mockPendingRepairs[text];
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
              
              const keyboard = Object.keys(mockPendingRepairs).map(bungalow => [{text: bungalow}]);
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
            
            await sendToGoogleSheets({
              bungalow: session.selectedBungalow,
              item: session.repairedIssue,
              quantity: 1,
              category: 'maintenance',
              notes: `Repair completed by ${msg.from.first_name}`,
              priority: 'completed',
              reportedBy: msg.from.first_name || 'User',
              section: 'maintenance',
              action: 'repair_completed'
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
                    [{text: '🔧 Urgent Repair'}],
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
            
            await sendToGoogleSheets({
              bungalow: session.bungalow,
              item: session.selectedType,
              quantity: 1,
              category: 'maintenance',
              notes: description,
              priority: priority,
              reportedBy: msg.from.first_name || 'User',
              section: 'maintenance'
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
    
  }, 2000);
  
}).catch((error) => {
  console.error('❌ Cleanup error:', error);
});'cleaning_number';
              
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
              await sendToGoogleSheets({
                bungalow: session.bungalow,
                item: 'Bungalow Ready',
                quantity: 1,
                category: 'status',
                notes: '',
                priority: 'normal',
                reportedBy: msg.from.first_name || 'User',
                section: 'cleaning'
              });
              
              bot.sendMessage(chatId, `🎉 *Bungalow Ready reported!*\n\n🏠 ${session.bungalow} is ready for guests\n\n/menu to return`, {
                parse_mode: 'Markdown',
                reply_markup: {remove_keyboard: true}
              });
              delete userSessions[chatId];
            } else if (text === '🔧 Maintenance Required') {
              await sendToGoogleSheets({
                bungalow: session.bungalow,
                item: 'Maintenance Required',
                quantity: 1,
                category: 'maintenance',
                notes: '',
                priority: 'high',
                reportedBy: msg.from.first_name || 'User',
                section: 'cleaning'
              });
              
              bot.sendMessage(chatId, `🔧 *Maintenance reported!*\n\n🏠 ${session.bungalow} needs maintenance\n\n/menu to return`, {
                parse_mode: 'Markdown',
                reply_markup: {remove_keyboard: true}
              });
              delete userSessions[chatId];
            } else if (text === '📦 Missing Items') {
              session.step = 'cleaning_category';
              
              bot.sendMessage(chatId, '📦 Choose category:', {
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
              
              bot.sendMessage(chatId, '📦 Choose category:', {
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
              
              for (const item of session.items) {
                try {
                  await sendToGoogleSheets({
                    bungalow: session.bungalow,
                    item: item.item,
                    quantity: item.quantity,
                    category: item.category,
                    notes: item.notes,
                    priority: 'normal',
                    reportedBy: msg.from.first_name || 'User',
                    section: 'cleaning'
                  });
                  successCount++;
                } catch (error) {
                  console.error('Send error:', error);
                }
              }
              
              const summary = session.items.map((item, index) => 
                `${index + 1}. ${item.item} x${item.quantity}`
              ).join('\n');
              
              bot.sendMessage(chatId, `🎉 *Report sent successfully!*\n\n🏠 Bungalow: ${session.bungalow}\n📦 ${successCount} items reported:\n\n${summary}\n\n/menu to return`, {
                parse_mode: 'Markdown',
                reply_markup: {remove_keyboard: true}
              });
              
              delete userSessions[chatId];
            } else if (text === '🗑️ Cancel All') {
              bot.sendMessage(chatId, '❌ Report cancelled.\n\n/menu to return', {
                reply_markup: {remove_keyboard: true}
              });
              delete userSessions[chatId];
            }
          }
        } else if (session.section === 'inventory') {
          if (session.step === 'inventory_choice') {
            if (text === '📦 Missing Items List') {
              let missingText = '📋 *Current Missing Items*\n\n';
              
              Object.entries(mockMissingItems).forEach(([bungalow, items]) => {
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
              bot.sendMessage(chatId, `📊 *Current Stock Status*\n\n🍽️ **Kitchen:**\n• Mugs Grey: 12 ✅\n• Mugs White: 3 ⚠️\n• Mugs Brown: 8 ✅\n• Dinner Plates Beige: 6 ✅\n\n🪑 **Outdoor:**\n• Outside Chairs White: 8 ✅\n• Outside Chairs Black: 5 ⚠️\n• BBQ Fork: 2 ⚠️\n\n/menu to return`, {
                parse_mode: 'Markdown',
                reply_markup: {remove_keyboard: true}
              });
              delete userSessions[chatId];
            }
          } else if (session.step === 'missing_items_list') {
            if (text === '🔄 Refresh List') {
              let missingText = '📋 *Current Missing Items*\n\n';
              
              Object.entries(mockMissingItems).forEach(([bungalow, items]) => {
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
              
              const keyboard = Object.keys(mockMissingItems).map(bungalow => [{text: bungalow}]);
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
            
            if (mockMissingItems[text]) {
              session.selectedBungalow = text;
              session.step = 'supply_item';
              
              const items = mockMissingItems[text];
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
              
              const keyboard = Object.keys(mockMissingItems).map(bungalow => [{text: bungalow}]);
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
              
              await sendToGoogleSheets({
                bungalow: session.selectedBungalow,
                item: itemName,
                quantity: suppliedQty,
                category: 'supplied',
                notes: `Item supplied by ${msg.from.first_name}. Original missing: ${session.totalMissing}, Supplied: ${suppliedQty}, Remaining: ${remaining}`,
                priority: remaining > 0 ? 'partial' : 'completed',
                reportedBy: msg.from.first_name || 'User',
                section: 'inventory',
                action: 'item_supplied'
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
        } else if (session.section === 'maintenance') {
          if (session.step === 'maintenance_choice') {
            if (text === '🔧 Pending Repairs') {
              let repairsText = '🔧 *Current Pending Repairs*\n\n';
              
              Object.entries(mockPendingRepairs).forEach(([bungalow, repairs]) => {
                repairsText += `${bungalow}:\n`;
                repairs.forEach(repair => {
                  const priorityIcon = repair.priority === 'urgent' ? '🔧' : 
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
              session.step =
