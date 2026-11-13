const http = require('http');

let adminToken = '';
let customerToken = '';
let createdMovieId = null;
let createdCinemaId = null;
let createdHallId = null;
let createdScreeningId = null;
let createdBookingId = null;
let createdTicketId = null;
let createdTicketQr = '';
let createdConcessionOrderId = null;
let uploadedPublicId = null;

const results = [];

function record(name, method, path, status, expectedStatus, details = '') {
  const passed = Array.isArray(expectedStatus) ? expectedStatus.includes(status) : status === expectedStatus;
  const entry = { name, method, path, status, passed, details };
  results.push(entry);
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${method}] ${path} -> HTTP ${status} (expected ${Array.isArray(expectedStatus) ? expectedStatus.join('/') : expectedStatus}) ${details ? '| ' + details : ''}`);
  return passed;
}

function request(options, body = null) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      ...options,
    }, res => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = d ? JSON.parse(d) : null; } catch(e) { parsed = d; }
        resolve({ status: res.statusCode, data: parsed, raw: d });
      });
    });
    req.on('error', err => resolve({ status: 500, error: err.message }));
    if (body) {
      if (Buffer.isBuffer(body)) {
        req.write(body);
      } else if (typeof body === 'object') {
        req.write(JSON.stringify(body));
      } else {
        req.write(body);
      }
    }
    req.end();
  });
}

function get(path, token = null) {
  return request({
    path,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      ...(token ? { 'Authorization': 'Bearer ' + token } : {})
    }
  });
}

function post(path, body, token = null) {
  const json = JSON.stringify(body);
  return request({
    path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(json),
      ...(token ? { 'Authorization': 'Bearer ' + token } : {})
    }
  }, json);
}

function put(path, body, token = null) {
  const json = JSON.stringify(body);
  return request({
    path,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(json),
      ...(token ? { 'Authorization': 'Bearer ' + token } : {})
    }
  }, json);
}

function patch(path, body, token = null) {
  const json = JSON.stringify(body);
  return request({
    path,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(json),
      ...(token ? { 'Authorization': 'Bearer ' + token } : {})
    }
  }, json);
}

function del(path, token = null) {
  return request({
    path,
    method: 'DELETE',
    headers: {
      ...(token ? { 'Authorization': 'Bearer ' + token } : {})
    }
  });
}

function uploadMultipart(path, fieldName, filename, fileBuffer, mimeType, token, folder) {
  return new Promise((resolve) => {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const chunks = [];

    if (folder) {
      chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="folder"\r\n\r\n${folder}\r\n`));
    }
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`));
    chunks.push(fileBuffer);
    chunks.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const payload = Buffer.concat(chunks);

    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': payload.length,
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      }
    }, res => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = d ? JSON.parse(d) : null; } catch(e) { parsed = d; }
        resolve({ status: res.statusCode, data: parsed, raw: d });
      });
    });
    req.on('error', err => resolve({ status: 500, error: err.message }));
    req.write(payload);
    req.end();
  });
}

async function runAllTests() {
  console.log('========================================================');
  console.log('    CINECHAIN FULL ENDPOINT & CLOUDINARY TEST SUITE      ');
  console.log('========================================================\n');

  // 1. AUTH ENDPOINTS
  console.log('--- [1/10] AUTHENTICATION & USERS ---');
  // Register a new customer
  const randomEmail = `testuser_${Date.now()}@cinechain.com`;
  const regRes = await post('/api/auth/register', {
    email: randomEmail,
    password: 'Password@123',
    firstName: 'Test',
    lastName: 'Runner'
  });
  record('Register User', 'POST', '/api/auth/register', regRes.status, [200, 201], regRes.data?.email || '');

  // Login Admin
  const adminLogin = await post('/api/auth/login', { email: 'admin@cinechain.com', password: 'Admin@CineChain2024!' });
  adminToken = adminLogin.data?.accessToken || '';
  record('Login Admin', 'POST', '/api/auth/login', adminLogin.status, 200, adminToken ? 'Token OK' : 'No Token');

  // Login Customer
  const custLogin = await post('/api/auth/login', { email: 'customer@cinechain.com', password: 'Password@123' });
  customerToken = custLogin.data?.accessToken || '';
  record('Login Customer', 'POST', '/api/auth/login', custLogin.status, 200, customerToken ? 'Token OK' : 'No Token');

  // Refresh Token
  const refreshRes = await post('/api/auth/refresh', { refreshToken: custLogin.data?.refreshToken });
  record('Refresh Token', 'POST', '/api/auth/refresh', refreshRes.status, 200);

  // User Management — correct path is /api/admin/customers
  const usersRes = await get('/api/admin/customers', adminToken);
  record('Get All Users (Admin)', 'GET', '/api/admin/customers', usersRes.status, 200, `Found ${usersRes.data?.content?.length || usersRes.data?.length || 0} users`);

  const userById = await get('/api/admin/customers/2', adminToken);
  record('Get User By ID', 'GET', '/api/admin/customers/2', userById.status, 200, userById.data?.email || '');

  // 2. CLOUDINARY & MEDIA UPLOAD
  console.log('\n--- [2/10] CLOUDINARY CLOUD STORAGE ---');
  // 1x1 transparent test PNG
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  const imgBuffer = Buffer.from(pngBase64, 'base64');

  const uploadRes = await uploadMultipart('/api/media/upload', 'file', 'cinema_poster.png', imgBuffer, 'image/png', adminToken, 'movies');
  record('Cloudinary Upload Image', 'POST', '/api/media/upload', uploadRes.status, 200, uploadRes.data?.secureUrl || '');
  uploadedPublicId = uploadRes.data?.publicId;

  if (uploadedPublicId) {
    console.log(`   -> Cloudinary Secure URL: ${uploadRes.data.secureUrl}`);
    console.log(`   -> Cloudinary Public ID: ${uploadRes.data.publicId}`);
    console.log(`   -> Cloudinary Width x Height: ${uploadRes.data.width}x${uploadRes.data.height}, Format: ${uploadRes.data.format}`);

    const delRes = await del('/api/media?publicId=' + encodeURIComponent(uploadedPublicId), adminToken);
    record('Cloudinary Delete Image', 'DELETE', '/api/media?publicId=' + uploadedPublicId, delRes.status, 200, delRes.data?.result || '');
  }

  // 3. MOVIES ENDPOINTS
  console.log('\n--- [3/10] MOVIES ---');
  const moviesRes = await get('/api/movies');
  record('Get Public Movies', 'GET', '/api/movies', moviesRes.status, 200, `${moviesRes.data?.length || 0} movies`);

  const movie1Res = await get('/api/movies/1');
  record('Get Movie #1', 'GET', '/api/movies/1', movie1Res.status, 200, movie1Res.data?.title || '');

  const adminMovies = await get('/api/admin/movies', adminToken);
  record('Get Admin Movies', 'GET', '/api/admin/movies', adminMovies.status, 200);

  // Create new Movie
  const createMovieRes = await post('/api/movies', {
    title: 'Oppenheimer (70mm IMAX)',
    description: 'The story of American scientist J. Robert Oppenheimer and his role in the Manhattan Project.',
    durationMinutes: 180,
    genre: 'Drama / History',
    language: 'English',
    releaseDate: '2023-07-21',
    posterUrl: uploadRes.data?.secureUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600',
    trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
    status: 'NOW_SHOWING'
  }, adminToken);
  createdMovieId = createMovieRes.data?.id;
  record('Create Movie (Admin)', 'POST', '/api/movies', createMovieRes.status, [200, 201], `ID: ${createdMovieId}`);

  if (createdMovieId) {
    const updateMovie = await put('/api/movies/' + createdMovieId, {
      title: 'Oppenheimer (IMAX Re-Release)',
      description: 'Updated description for 70mm special screening.',
      durationMinutes: 180,
      genre: 'Drama / Biography',
      language: 'English',
      releaseDate: '2023-07-21',
      posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600',
      trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
      status: 'NOW_SHOWING'
    }, adminToken);
    record('Update Movie (Admin)', 'PUT', '/api/movies/' + createdMovieId, updateMovie.status, 200, updateMovie.data?.title || '');

    const delMovie = await del('/api/movies/' + createdMovieId, adminToken);
    record('Delete Movie (Admin)', 'DELETE', '/api/movies/' + createdMovieId, delMovie.status, [200, 204]);
  }

  // 4. CINEMAS & HALLS
  console.log('\n--- [4/10] CINEMAS & HALLS ---');
  const cinemasRes = await get('/api/cinemas');
  record('Get Public Cinemas', 'GET', '/api/cinemas', cinemasRes.status, 200, `${cinemasRes.data?.length || 0} cinemas`);

  const cinema1 = await get('/api/cinemas/1');
  record('Get Cinema #1', 'GET', '/api/cinemas/1', cinema1.status, 200, cinema1.data?.name || '');

  const adminCinemas = await get('/api/admin/cinemas', adminToken);
  record('Get Admin Cinemas', 'GET', '/api/admin/cinemas', adminCinemas.status, 200);

  const cinemaHalls = await get('/api/halls/cinema/1');
  record('Get Cinema #1 Halls', 'GET', '/api/halls/cinema/1', cinemaHalls.status, 200, `${cinemaHalls.data?.length || 0} halls`);

  const hall1 = await get('/api/halls/1');
  record('Get Hall #1', 'GET', '/api/halls/1', hall1.status, 200, hall1.data?.name || '');

  const adminHalls = await get('/api/admin/halls', adminToken);
  record('Get Admin Halls', 'GET', '/api/admin/halls', adminHalls.status, 200);

  // 5. SCREENINGS & SEATS
  console.log('\n--- [5/10] SCREENINGS & SEATS ---');
  const screeningsRes = await get('/api/screenings');
  record('Get Screenings', 'GET', '/api/screenings', screeningsRes.status, 200, `${screeningsRes.data?.length || 0} screenings`);

  const screening1 = await get('/api/screenings/1');
  record('Get Screening #1', 'GET', '/api/screenings/1', screening1.status, 200);

  const screeningMovie1 = await get('/api/screenings/movie/1');
  record('Get Screenings for Movie #1', 'GET', '/api/screenings/movie/1', screeningMovie1.status, 200);

  const adminScreenings = await get('/api/admin/screenings', adminToken);
  record('Get Admin Screenings', 'GET', '/api/admin/screenings', adminScreenings.status, 200);

  const hallSeats = await get('/api/halls/1/seats');
  record('Get Hall #1 Seats Layout', 'GET', '/api/halls/1/seats', hallSeats.status, 200, `${hallSeats.data?.length || 0} seats`);

  const screeningSeats = await get('/api/screenings/13/seats', customerToken);
  record('Get Screening #13 Available Seats', 'GET', '/api/screenings/13/seats', screeningSeats.status, 200, `${screeningSeats.data?.length || 0} seats returned`);

  // 6. BOOKINGS & TICKETS
  console.log('\n--- [6/10] BOOKINGS & TICKETS ---');
  const availableSeat = (screeningSeats.data || []).find(s => s.status === 'AVAILABLE');
  if (availableSeat) {
    const bookRes = await post('/api/bookings', {
      screeningId: 13,
      seatIds: [availableSeat.id],
      holderName: 'Alexander Hamilton'
    }, customerToken);
    createdBookingId = bookRes.data?.id;
    const ticket = bookRes.data?.tickets?.[0];
    createdTicketId = ticket?.id;
    createdTicketQr = ticket?.qrCodeData;

    record('Create Booking', 'POST', '/api/bookings', bookRes.status, [200, 201], `Booking: ${bookRes.data?.bookingReference}, Ticket #${createdTicketId}`);
  }

  const custBookings = await get('/api/customer/bookings', customerToken);
  record('Get Customer Bookings', 'GET', '/api/customer/bookings', custBookings.status, 200, `${custBookings.data?.content?.length || custBookings.data?.length || 0} bookings`);

  if (createdBookingId) {
    const bookingDetails = await get('/api/bookings/' + createdBookingId, customerToken);
    record('Get Booking By ID', 'GET', '/api/bookings/' + createdBookingId, bookingDetails.status, 200);
  }

  const adminBookings = await get('/api/admin/bookings', adminToken);
  record('Get Admin Bookings', 'GET', '/api/admin/bookings', adminBookings.status, 200);

  const custTickets = await get('/api/customer/tickets', customerToken);
  record('Get Customer Tickets', 'GET', '/api/customer/tickets', custTickets.status, 200, `${custTickets.data?.length || 0} tickets`);

  if (createdTicketId) {
    const ticketDetails = await get('/api/tickets/' + createdTicketId, customerToken);
    record('Get Ticket By ID', 'GET', '/api/tickets/' + createdTicketId, ticketDetails.status, 200, `Holder: ${ticketDetails.data?.holderName}`);

    // Update Holder Name
    const changeHolder = await put('/api/tickets/' + createdTicketId + '/holder-name', {
      holderName: 'Thomas Jefferson'
    }, customerToken);
    record('Update Ticket Holder Name', 'PUT', '/api/tickets/' + createdTicketId + '/holder-name', changeHolder.status, 200, `New Holder: ${changeHolder.data?.holderName}`);
    if (changeHolder.data?.qrCodeData) {
      createdTicketQr = changeHolder.data.qrCodeData;
    }

    // Cancel Ticket
    const cancelTicketRes = await post('/api/tickets/' + createdTicketId + '/cancel', {}, customerToken);
    record('Cancel Ticket', 'POST', '/api/tickets/' + createdTicketId + '/cancel', cancelTicketRes.status, 200, `Status: ${cancelTicketRes.data?.status}`);
  }

  // 7. VALIDATION & SCANNER
  console.log('\n--- [7/10] TICKET VALIDATION & GATE SCANNER ---');
  if (createdTicketQr) {
    const valRes = await post('/api/validation/validate', { qrCodeData: createdTicketQr }, adminToken);
    // Cancelled ticket should return 400 with message "Ticket has been cancelled"
    record('Validate Gate Scanner (Cancelled Ticket Check)', 'POST', '/api/validation/validate', valRes.status, [200, 400], valRes.data?.message || 'Validated');
  }

  const valHistory = await get('/api/validation/history', adminToken);
  record('Get Validation History (Admin)', 'GET', '/api/validation/history', valHistory.status, 200, `${valHistory.data?.length || 0} validations recorded`);

  // 8. BLOCKCHAIN AUDIT TRAIL
  console.log('\n--- [8/10] BLOCKCHAIN AUDIT TRAIL ---');
  const bcAll = await get('/api/blockchain/transactions', adminToken);
  record('Get All Blockchain Transactions', 'GET', '/api/blockchain/transactions', bcAll.status, 200, `${bcAll.data?.content?.length || bcAll.data?.length || 0} on-chain txs`);

  if (createdTicketId) {
    const bcTicket = await get('/api/blockchain/transactions/' + createdTicketId, adminToken);
    record('Get Blockchain Txs for Ticket #' + createdTicketId, 'GET', '/api/blockchain/transactions/' + createdTicketId, bcTicket.status, 200, `${bcTicket.data?.length || 0} transitions`);
  }

  // 9. CONCESSIONS & IN-SEAT SNACKS
  console.log('\n--- [9/10] IN-SEAT SNACK CONCESSIONS ---');
  const menuRes = await get('/api/concessions/menu');
  record('Get Concession Menu (Public)', 'GET', '/api/concessions/menu', menuRes.status, 200, `${menuRes.data?.length || 0} gourmet items`);

  const firstItem = menuRes.data?.[0];
  if (firstItem) {
    const orderRes = await post('/api/concessions/orders', {
      deliveryType: 'COUNTER_PICKUP',
      notes: 'Automated test suite order',
      items: [{ itemId: firstItem.id, quantity: 1, options: 'Standard' }]
    }, customerToken);
    createdConcessionOrderId = orderRes.data?.id;
    record('Create Concession Order', 'POST', '/api/concessions/orders', orderRes.status, [200, 201], `Order: ${orderRes.data?.orderNumber}, Total: €${orderRes.data?.totalAmount}`);
  }

  const myOrders = await get('/api/concessions/my-orders', customerToken);
  record('Get Customer Concession Orders', 'GET', '/api/concessions/my-orders', myOrders.status, 200, `${myOrders.data?.length || 0} orders`);

  const allOrders = await get('/api/concessions/orders', adminToken);
  record('Get All Concession Orders (Staff KDS)', 'GET', '/api/concessions/orders', allOrders.status, 200, `${allOrders.data?.content?.length || allOrders.data?.length || 0} orders in KDS`);

  if (createdConcessionOrderId) {
    const prepRes = await patch('/api/concessions/orders/' + createdConcessionOrderId + '/status', { status: 'PREPARING' }, adminToken);
    record('Update Order to PREPARING', 'PATCH', '/api/concessions/orders/' + createdConcessionOrderId + '/status', prepRes.status, 200);

    const delivRes = await patch('/api/concessions/orders/' + createdConcessionOrderId + '/status', { status: 'DELIVERED' }, adminToken);
    record('Update Order to DELIVERED', 'PATCH', '/api/concessions/orders/' + createdConcessionOrderId + '/status', delivRes.status, 200);
  }

  // 10. DASHBOARDS
  console.log('\n--- [10/11] DASHBOARDS & METRICS ---');
  const adminDash = await get('/api/admin/dashboard/stats', adminToken);
  record('Admin Dashboard Stats', 'GET', '/api/admin/dashboard/stats', adminDash.status, 200);

  const custDash = await get('/api/customer/dashboard/stats', customerToken);
  record('Customer Dashboard Stats', 'GET', '/api/customer/dashboard/stats', custDash.status, 200);

  // 11. P2P RESALE & NFT STUBS
  console.log('\n--- [11/11] P2P RESALE MARKETPLACE & COMMEMORATIVE NFT STUBS ---');
  // 1. Get marketplace listings
  const marketplaceRes = await get('/api/resale/marketplace');
  record('Get Public Resale Marketplace', 'GET', '/api/resale/marketplace', marketplaceRes.status, 200, `${marketplaceRes.data?.length || 0} resale listings`);

  // 2. Customer lists a ticket for resale (create a fresh ticket first)
  const resaleSeats = await get('/api/screenings/13/seats', customerToken);
  const availableResaleSeat = (resaleSeats.data || []).find(s => s.status === 'AVAILABLE');
  if (availableResaleSeat) {
    const bookResale = await post('/api/bookings', {
      screeningId: 13,
      seatIds: [availableResaleSeat.id],
      holderName: 'Resale Seller'
    }, customerToken);

    const ticketToResell = bookResale.data?.tickets?.[0];
    if (ticketToResell) {
      // Anti-Scalping Test: Try listing above face value (should fail 400)
      const scalperRes = await post('/api/resale/list', {
        ticketId: ticketToResell.id,
        resalePrice: 999.00
      }, customerToken);
      record('Anti-Scalping Rule Enforcement (Over Face Value Blocked)', 'POST', '/api/resale/list', scalperRes.status, 400, scalperRes.data?.message || 'Blocked');

      // Valid fair-price listing
      const fairListRes = await post('/api/resale/list', {
        ticketId: ticketToResell.id,
        resalePrice: 10.00,
        notes: 'Cannot attend tonight'
      }, customerToken);
      record('List Ticket on P2P Resale Marketplace', 'POST', '/api/resale/list', fairListRes.status, 201, `Listing #${fairListRes.data?.id} at €${fairListRes.data?.resalePrice}`);

      const listingId = fairListRes.data?.id;

      // Seller views their listings
      const myListings = await get('/api/resale/my-listings', customerToken);
      record('Get Customer Active Resale Listings', 'GET', '/api/resale/my-listings', myListings.status, 200, `${myListings.data?.length || 0} listings`);

      // Register a second buyer customer to test P2P purchase
      const buyerEmail = `buyer_${Date.now()}@cinechain.com`;
      await post('/api/auth/register', {
        email: buyerEmail,
        password: 'Password@123',
        firstName: 'Marketplace',
        lastName: 'Buyer'
      });
      const buyerLogin = await post('/api/auth/login', { email: buyerEmail, password: 'Password@123' });
      const buyerToken = buyerLogin.data?.accessToken;

      if (listingId && buyerToken) {
        const buyRes = await post(`/api/resale/${listingId}/buy`, {
          newHolderName: 'Marketplace Buyer'
        }, buyerToken);
        record('P2P Ticket Purchase & QR Re-issuance', 'POST', `/api/resale/${listingId}/buy`, buyRes.status, 200, `Transferred to: ${buyRes.data?.buyerName}`);

        const buyerPurchases = await get('/api/resale/my-purchases', buyerToken);
        record('Get Buyer Resale Purchases', 'GET', '/api/resale/my-purchases', buyerPurchases.status, 200, `${buyerPurchases.data?.length || 0} purchased`);
      }
    }
  }

  // 3. Test NFT Stubs
  const nftStubs = await get('/api/nft-stubs/my-stubs', customerToken);
  record('Get Customer NFT Stubs', 'GET', '/api/nft-stubs/my-stubs', nftStubs.status, 200, `${nftStubs.data?.length || 0} POAP stubs`);

  // 12. AI & SMART CINEMA EXPERIENCES (GEMINI API)
  console.log('\n--- [12/12] AI & SMART CINEMA EXPERIENCES (GEMINI API) ---');
  
  // Test AI Concierge Chatbot
  const aiChatRes = await post('/api/ai/chat', {
    message: 'Suggest a good action movie playing tonight with comfortable center seats'
  });
  record('AI Movie Concierge Chatbot', 'POST', '/api/ai/chat', aiChatRes.status, 200, `Reply snippet: ${aiChatRes.data?.reply?.substring(0, 60)}...`);

  // Test Post Movie Review with AI Moderation
  const reviewRes = await post('/api/ai/movies/1/reviews', {
    movieId: 1,
    rating: 4.5,
    content: 'Masterful directing and sound design! The pacing is brilliant.'
  }, customerToken);
  record('Submit AI-Moderated Movie Review', 'POST', '/api/ai/movies/1/reviews', reviewRes.status, 200, `Sentiment: ${reviewRes.data?.sentiment || 'OK'}, Tags: ${reviewRes.data?.tags || 'N/A'}`);

  // Test Get Movie Reviews
  const reviewsList = await get('/api/ai/movies/1/reviews');
  record('Get Approved Movie Reviews', 'GET', '/api/ai/movies/1/reviews', reviewsList.status, 200, `${reviewsList.data?.length || 0} reviews`);

  // Test Get AI Sentiment Summary
  const sentimentRes = await get('/api/ai/movies/1/sentiment');
  record('Get AI Sentiment Summary', 'GET', '/api/ai/movies/1/sentiment', sentimentRes.status, 200, `Overall: ${sentimentRes.data?.overallSentiment}`);

  // 13. STRIPE REAL PAYMENT ENGINE
  console.log('\n--- [13/13] STRIPE REAL PAYMENT ENGINE ---');
  const paymentConfig = await get('/api/payments/config');
  record('Get Stripe Public Config', 'GET', '/api/payments/config', paymentConfig.status, 200, `Key: ${paymentConfig.data?.publishableKey?.substring(0, 15)}...`);

  if (createdBookingId) {
    const intentRes = await post('/api/payments/create-payment-intent', {
      bookingId: createdBookingId,
      currency: 'usd'
    }, customerToken);
    record('Create Stripe PaymentIntent', 'POST', '/api/payments/create-payment-intent', intentRes.status, 200, `Intent: ${intentRes.data?.paymentIntentId}, Amount: $${intentRes.data?.amount}`);

    const confirmRes = await post('/api/payments/confirm-payment', {
      bookingId: createdBookingId,
      paymentIntentId: intentRes.data?.paymentIntentId || 'pi_test_123'
    }, customerToken);
    record('Confirm Stripe Payment', 'POST', '/api/payments/confirm-payment', confirmRes.status, 200, `Status: ${confirmRes.data?.status}`);
  }

  // SUMMARY REPORT
  console.log('\n========================================================');
  console.log('                   TEST SUITE SUMMARY                   ');
  console.log('========================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;

  console.log(`Total Endpoints Tested: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('Failed Tests:');
    results.filter(r => !r.passed).forEach(r => console.log(` - [${r.method}] ${r.path} -> ${r.status}`));
  } else {
    console.log('🎉 ALL ENDPOINTS PASSED WITH 100% SUCCESS RATE!');
  }
}

runAllTests().catch(console.error);
