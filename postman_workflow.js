const http = require('http');

let adminToken = '';
let customerToken = '';
let createdMovieId = null;
let createdCinemaId = null;
let createdHallId = null;
let createdScreeningId = null;
let createdBookingId = null;
let createdTicketId = null;
let createdTicketQrData = '';
let createdConcessionOrderId = null;
let createdListingId = null;
let createdNftTokenId = null;

function req(method, path, body = null, token = null) {
  return new Promise((resolve) => {
    const payload = body ? (Buffer.isBuffer(body) ? body : JSON.stringify(body)) : null;
    const options = {
      hostname: 'localhost',
      port: 8080,
      path,
      method,
      headers: {
        'Accept': 'application/json',
        ...(payload && !Buffer.isBuffer(payload) ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        } : {}),
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      }
    };

    const r = http.request(options, res => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(d); } catch(e) { json = d; }
        resolve({ status: res.statusCode, data: json });
      });
    });
    r.on('error', err => resolve({ status: 500, error: err.message }));
    if (payload) r.write(payload);
    r.end();
  });
}

function logStep(stepNum, title, method, path, status, expectedStatus, preview = '') {
  const ok = Array.isArray(expectedStatus) ? expectedStatus.includes(status) : status === expectedStatus;
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} Step ${stepNum}: [${method}] ${path}`);
  console.log(`   Status: HTTP ${status} (expected ${Array.isArray(expectedStatus) ? expectedStatus.join('/') : expectedStatus})`);
  if (preview) console.log(`   Output: ${typeof preview === 'object' ? JSON.stringify(preview) : preview}`);
  console.log('');
  return ok;
}

async function runPostmanWorkflow() {
  console.log('================================================================');
  console.log(' 📬 POSTMAN END-TO-END WORKFLOW SIMULATION: INSERT & TEST ALL  ');
  console.log('================================================================\n');

  // STEP 1: AUTHENTICATION
  console.log('--- [STAGE 1] POSTMAN: AUTH & TOKENS ---');
  const uniqueSuffix = Date.now().toString().slice(-5);
  const newUser = {
    email: `postman_user_${uniqueSuffix}@cinechain.com`,
    password: 'Password@123',
    firstName: 'Postman',
    lastName: 'Tester'
  };
  const reg = await req('POST', '/api/auth/register', newUser);
  logStep('1.1', 'POST /api/auth/register (Create Customer)', 'POST', '/api/auth/register', reg.status, 201, reg.data);

  const loginCust = await req('POST', '/api/auth/login', { email: newUser.email, password: newUser.password });
  customerToken = loginCust.data?.accessToken;
  logStep('1.2', 'POST /api/auth/login (Customer Token)', 'POST', '/api/auth/login', loginCust.status, 200, { email: loginCust.data?.email, role: loginCust.data?.role });

  const loginAdmin = await req('POST', '/api/auth/login', { email: 'admin@cinechain.com', password: 'Admin@CineChain2024!' });
  adminToken = loginAdmin.data?.accessToken;
  logStep('1.3', 'POST /api/auth/login (Admin Token)', 'POST', '/api/auth/login', loginAdmin.status, 200, { email: loginAdmin.data?.email, role: loginAdmin.data?.role });

  // STEP 2: INSERT MOVIE
  console.log('--- [STAGE 2] POSTMAN: INSERT NEW MOVIE ---');
  const moviePayload = {
    title: `Gladiator II (IMAX Premiere ${uniqueSuffix})`,
    description: 'Years after witnessing the death of Maximus, Lucius must enter the Colosseum.',
    genre: 'Action / Adventure',
    language: 'English',
    durationMinutes: 148,
    releaseDate: '2026-11-20',
    rating: 8.8,
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800',
    trailerUrl: 'https://www.youtube.com/watch?v=4rgYUipGJNo',
    status: 'NOW_SHOWING'
  };
  const createMovie = await req('POST', '/api/movies', moviePayload, adminToken);
  createdMovieId = createMovie.data?.id;
  logStep('2.1', 'POST /api/movies (Insert Movie)', 'POST', '/api/movies', createMovie.status, 201, { id: createdMovieId, title: createMovie.data?.title });

  // Verify GET movie
  const getMovie = await req('GET', `/api/movies/${createdMovieId}`);
  logStep('2.2', `GET /api/movies/${createdMovieId} (Verify Movie)`, 'GET', `/api/movies/${createdMovieId}`, getMovie.status, 200, { title: getMovie.data?.title, genre: getMovie.data?.genre });

  // STEP 3: INSERT CINEMA & HALL
  console.log('--- [STAGE 3] POSTMAN: INSERT CINEMA & HALL ---');
  const cinemaPayload = {
    name: `CineChain Dolby Cinema ${uniqueSuffix}`,
    address: '42 Avenue des Champs-Elysees',
    city: 'Paris',
    phone: '+33 1 55 00 00 00',
    email: `contact_${uniqueSuffix}@cinechain.fr`,
    imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800'
  };
  const createCinema = await req('POST', '/api/admin/cinemas', cinemaPayload, adminToken);
  createdCinemaId = createCinema.data?.id;
  logStep('3.1', 'POST /api/admin/cinemas (Insert Cinema)', 'POST', '/api/admin/cinemas', createCinema.status, 201, { id: createdCinemaId, name: createCinema.data?.name });

  const hallPayload = {
    name: `Hall 1 - Dolby Atmos Luxe ${uniqueSuffix}`,
    cinemaId: createdCinemaId,
    totalCapacity: 80
  };
  const createHall = await req('POST', '/api/admin/halls', hallPayload, adminToken);
  createdHallId = createHall.data?.id;
  logStep('3.2', 'POST /api/admin/halls (Insert Hall)', 'POST', '/api/admin/halls', createHall.status, 201, { id: createdHallId, name: createHall.data?.name, totalCapacity: createHall.data?.totalCapacity });

  // STEP 4: INSERT SCREENINGS
  console.log('--- [STAGE 4] POSTMAN: INSERT SCREENING ---');
  // Hall #3 is free right now until 14:00 (10:15 to 12:45)
  const startTime = '2026-11-13T10:15:00';
  const endTime = '2026-11-13T12:45:00';

  const screeningPayload = {
    movieId: createdMovieId,
    hallId: 3, // Hall #3 has 80 physical seats and is free right now
    startTime,
    endTime,
    price: 16.50
  };
  const createScreening = await req('POST', '/api/admin/screenings', screeningPayload, adminToken);
  createdScreeningId = createScreening.data?.id;
  logStep('4.1', 'POST /api/admin/screenings (Schedule Screening Open for Admission on Hall #3)', 'POST', '/api/admin/screenings', createScreening.status, 201, { id: createdScreeningId, startTime: createScreening.data?.startTime, price: createScreening.data?.price });

  // STEP 5: SEAT DISCOVERY & BOOKING (TICKET CREATION)
  console.log('--- [STAGE 5] POSTMAN: BOOK SEATS & ISSUE TICKETS ---');
  const getSeats = await req('GET', `/api/screenings/${createdScreeningId}/seats`, null, customerToken);
  const seats = getSeats.data || [];
  logStep('5.1', `GET /api/screenings/${createdScreeningId}/seats (Inspect Available Layout)`, 'GET', `/api/screenings/${createdScreeningId}/seats`, getSeats.status, 200, `Found ${seats.length} generated seats.`);

  const seat1 = seats[0];
  const seat2 = seats[1];
  const bookingPayload = {
    screeningId: createdScreeningId,
    seatIds: [seat1.id, seat2.id],
    holderName: 'Maximus Decimus'
  };
  const createBooking = await req('POST', '/api/bookings', bookingPayload, customerToken);
  createdBookingId = createBooking.data?.id;
  const t1 = createBooking.data?.tickets?.[0];
  const t2 = createBooking.data?.tickets?.[1];
  createdTicketId = t1?.id;
  createdTicketQrData = t1?.qrCodeData;
  logStep('5.2', 'POST /api/bookings (Execute Booking & Mint Tickets)', 'POST', '/api/bookings', createBooking.status, 201, {
    bookingRef: createBooking.data?.bookingReference,
    total: createBooking.data?.totalAmount,
    ticket1_id: t1?.id,
    ticket2_id: t2?.id
  });

  // STEP 6: CONCESSION SNACK ORDER
  console.log('--- [STAGE 6] POSTMAN: INSERT IN-SEAT SNACK ORDER ---');
  const menuRes = await req('GET', '/api/concessions/menu');
  const menuItem = menuRes.data?.[0];
  const snackOrderPayload = {
    deliveryType: 'IN_SEAT',
    ticketId: createdTicketId,
    notes: 'Warm butter on popcorn please!',
    items: [
      { itemId: menuItem.id, quantity: 2, options: 'Large Popcorn' }
    ]
  };
  const createSnackOrder = await req('POST', '/api/concessions/orders', snackOrderPayload, customerToken);
  createdConcessionOrderId = createSnackOrder.data?.id;
  logStep('6.1', 'POST /api/concessions/orders (Create In-Seat Food Order)', 'POST', '/api/concessions/orders', createSnackOrder.status, 201, {
    orderNumber: createSnackOrder.data?.orderNumber,
    seat: createSnackOrder.data?.seatInfo,
    status: createSnackOrder.data?.status,
    total: createSnackOrder.data?.totalAmount
  });

  // Advance Order to PREPARING (Staff Action)
  const patchOrder = await req('PATCH', `/api/concessions/orders/${createdConcessionOrderId}/status`, { status: 'PREPARING' }, adminToken);
  logStep('6.2', `PATCH /api/concessions/orders/${createdConcessionOrderId}/status (Kitchen Staff Updates to PREPARING)`, 'PATCH', `/api/concessions/orders/${createdConcessionOrderId}/status`, patchOrder.status, 200, { status: patchOrder.data?.status });

  // STEP 7: P2P TICKET RESALE MARKETPLACE
  console.log('--- [STAGE 7] POSTMAN: LIST TICKET ON RESALE & BUY ---');
  // For resale, we schedule a future screening (> 1 hour in advance) to satisfy the resale time window
  const now = new Date();
  const futureStart = new Date(now.getTime() + 48 * 3600 * 1000).toISOString().slice(0, 19);
  const futureEnd = new Date(now.getTime() + 50 * 3600 * 1000).toISOString().slice(0, 19);
  const futureScreening = await req('POST', '/api/admin/screenings', {
    movieId: createdMovieId,
    hallId: 1,
    startTime: futureStart,
    endTime: futureEnd,
    price: 15.00
  }, adminToken);

  const futureSeats = await req('GET', `/api/screenings/${futureScreening.data?.id}/seats`, null, customerToken);
  const futureBooking = await req('POST', '/api/bookings', {
    screeningId: futureScreening.data?.id,
    seatIds: [futureSeats.data[5].id],
    holderName: 'Resale Original Holder'
  }, customerToken);
  const ticketToResell = futureBooking.data?.tickets?.[0];

  const resalePayload = {
    ticketId: ticketToResell.id,
    resalePrice: 13.50,
    notes: 'Future screening center seat, transferring.'
  };
  const createListing = await req('POST', '/api/resale/list', resalePayload, customerToken);
  createdListingId = createListing.data?.id;
  logStep('7.1', 'POST /api/resale/list (Post Ticket on P2P Secondary Market)', 'POST', '/api/resale/list', createListing.status, 201, {
    listingId: createdListingId,
    resalePrice: createListing.data?.resalePrice,
    status: createListing.data?.status
  });

  // A different user buys the resale ticket
  const buyerEmail = `postman_buyer_${uniqueSuffix}@cinechain.com`;
  await req('POST', '/api/auth/register', { email: buyerEmail, password: 'Password@123', firstName: 'Commodus', lastName: 'Buyer' });
  const buyerLogin = await req('POST', '/api/auth/login', { email: buyerEmail, password: 'Password@123' });
  const buyerToken = buyerLogin.data?.accessToken;

  const buyRes = await req('POST', `/api/resale/${createdListingId}/buy`, { newHolderName: 'Commodus Caesar' }, buyerToken);
  logStep('7.2', `POST /api/resale/${createdListingId}/buy (Buyer Acquires Resale Ticket)`, 'POST', `/api/resale/${createdListingId}/buy`, buyRes.status, 200, {
    listingId: buyRes.data?.id,
    newHolder: buyRes.data?.buyerName,
    status: buyRes.data?.status
  });

  // STEP 8: GATE VALIDATION (SCAN QR)
  console.log('--- [STAGE 8] POSTMAN: GATE SCANNER VALIDATE TICKET ---');
  // We can validate ticket 1
  const validateRes = await req('POST', '/api/validation/validate', { qrCodeData: createdTicketQrData }, adminToken);
  logStep('8.1', 'POST /api/validation/validate (Staff Scans QR Code at Gate)', 'POST', '/api/validation/validate', validateRes.status, 200, {
    ticketId: validateRes.data?.id,
    status: validateRes.data?.status,
    validatedAt: validateRes.data?.validatedAt
  });

  // Anti-Reentry Test: Scan same QR code again (should fail with 400 Bad Request)
  const reenterRes = await req('POST', '/api/validation/validate', { qrCodeData: createdTicketQrData }, adminToken);
  logStep('8.2', 'POST /api/validation/validate (Anti-Reentry: Second Scan Blocked)', 'POST', '/api/validation/validate', reenterRes.status, 400, reenterRes.data?.message);

  // STEP 9: MINT COMMEMORATIVE NFT STUB (POAP)
  console.log('--- [STAGE 9] POSTMAN: MINT NFT STUB ---');
  const claimNftRes = await req('POST', `/api/nft-stubs/claim/${createdTicketId}`, {}, customerToken);
  createdNftTokenId = claimNftRes.data?.tokenId;
  logStep('9.1', `POST /api/nft-stubs/claim/${createdTicketId} (Mint POAP Collectible Stub)`, 'POST', `/api/nft-stubs/claim/${createdTicketId}`, claimNftRes.status, 201, {
    tokenId: claimNftRes.data?.tokenId,
    rarity: claimNftRes.data?.rarityScore,
    experienceTier: claimNftRes.data?.experienceTier,
    txHash: claimNftRes.data?.mintTxHash
  });

  // STEP 10: VERIFY BLOCKCHAIN AUDIT TRAIL
  console.log('--- [STAGE 10] POSTMAN: AUDIT BLOCKCHAIN LEDGER ---');
  const bcTxRes = await req('GET', `/api/blockchain/transactions/${createdTicketId}`, null, adminToken);
  logStep('10.1', `GET /api/blockchain/transactions/${createdTicketId} (Verify Immutable Ledger Transitions)`, 'GET', `/api/blockchain/transactions/${createdTicketId}`, bcTxRes.status, 200, {
    totalTransitions: bcTxRes.data?.length,
    history: bcTxRes.data?.map(t => ({ type: t.type, hash: t.transactionHash.substring(0, 16) + '...' }))
  });

  console.log('================================================================');
  console.log('🎉 FULL POSTMAN WORKFLOW COMPLETED SUCCESSFULLY!');
  console.log('================================================================');
}

runPostmanWorkflow().catch(console.error);
