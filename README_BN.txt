MY FINANCE — প্রাথমিক Firebase Web App

গুরুত্বপূর্ণ:
এটি প্রথম ধাপের নিরাপদ starter version; সম্পূর্ণ পরিকল্পনার সব ফিচার এখনো তৈরি হয়নি।
বর্তমানে Google Login, ব্যক্তিগত আয়/খরচের এন্ট্রি ও ইতিহাস, সঞ্চয় লক্ষ্য এবং লোনের প্রাথমিক তালিকা আছে।
Family Code/approval, installment payment history, cash/bank transfers, budgets, reminders,
PDF/Excel export, full English translation এবং Android APK build পরের ধাপে যোগ করতে হবে।

১) app.js ফাইলে firebaseConfig অংশে Firebase Console-এর Web App Config বসাও।
২) Firebase Authentication-এ Google provider Enabled থাকতে হবে।
৩) Firestore > Rules-এ firestore.rules ফাইলের নিয়ম বসিয়ে Publish করো।
৪) Firebase Authentication > Settings > Authorized domains-এ Netlify domain যোগ করতে হবে
   (Netlify-তে deploy করার পরে)।
৫) index.html, app.js, styles.css, manifest.webmanifest ফাইল GitHub repository-তে আপলোড করো।
৬) Netlify-তে GitHub repository connect করে deploy করো।

নিরাপত্তা:
- বর্তমান rules শুধু users/{নিজের UID}/... path-এ নিজের account-কে access দেয়।
- Family sharing চালু করার আগে membership approval ও access rules তৈরি করতে হবে।
- কখনো Firestore-এ allow read, write: if true; ব্যবহার কোরো না।
- Service account JSON বা private key কারও সঙ্গে শেয়ার কোরো না।
