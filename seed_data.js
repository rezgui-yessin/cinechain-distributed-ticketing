const http = require('http');

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
      const json = typeof body === 'string' ? body : JSON.stringify(body);
      req.write(json);
    }
    req.end();
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

async function seedData() {
  console.log('🎬 [CineChain] Seeding rich data for all endpoints & UI showcase...\n');

  // 1. Authenticate Admin and Customer
  const adminLogin = await post('/api/auth/login', { email: 'admin@cinechain.com', password: 'Admin@CineChain2024!' });
  const adminToken = adminLogin.data?.accessToken;

  const custLogin = await post('/api/auth/login', { email: 'customer@cinechain.com', password: 'Password@123' });
  const custToken = custLogin.data?.accessToken;

  if (!adminToken || !custToken) {
    console.error('Failed to log in users.');
    return;
  }
  console.log('✅ Admin & Customer authenticated.');

  // 2. Fetch upcoming screenings
  const screeningsRes = await get('/api/screenings');
  let screenings = screeningsRes.data?.content || screeningsRes.data || [];
  if (!Array.isArray(screenings) || screenings.length === 0) {
    const adminScr = await get('/api/admin/screenings', adminToken);
    screenings = adminScr.data?.content || adminScr.data || [];
  }
  console.log(`✅ Loaded ${screenings.length} screenings.`);

  // 3. Create fresh Active Bookings for Customer
  const targetScreening = screenings.find(s => new Date(s.startTime) > new Date(Date.now() + 3600000)) || screenings[0];
  const screeningId = targetScreening?.id || 84;
  console.log(`📌 Using screening #${screeningId} (${targetScreening?.movie?.title || 'Featured Movie'}) for sample bookings.`);

  const seatsRes = await get(`/api/screenings/${screeningId}/seats`, custToken);
  const seats = seatsRes.data || [];
  const availableSeats = seats.filter(s => s.status === 'AVAILABLE');
  console.log(`✅ Found ${availableSeats.length} available seats for screening #${screeningId}.`);

  const createdTickets = [];
  if (availableSeats.length >= 4) {
    // Booking 1: Pair of VIP seats
    const b1 = await post('/api/bookings', {
      screeningId,
      seatIds: [availableSeats[0].id, availableSeats[1].id],
      holderName: 'Sarah Connor'
    }, custToken);
    if (b1.data?.tickets) {
      createdTickets.push(...b1.data.tickets);
      console.log(`🎟️ Created Booking ${b1.data.bookingReference} with 2 tickets (IDs: ${b1.data.tickets.map(t=>t.id).join(', ')}).`);
    }

    // Booking 2: Single seat for Resale demonstration
    const b2 = await post('/api/bookings', {
      screeningId,
      seatIds: [availableSeats[2].id],
      holderName: 'Bruce Wayne'
    }, custToken);
    if (b2.data?.tickets?.[0]) {
      const ticketToResell = b2.data.tickets[0];
      console.log(`🎟️ Created Booking ${b2.data.bookingReference} with Ticket #${ticketToResell.id} for Resale.`);

      // List this ticket on the P2P Resale Marketplace at fair discount
      const resaleRes = await post('/api/resale/list', {
        ticketId: ticketToResell.id,
        resalePrice: (targetScreening?.price || 15.0) - 2.50,
        notes: 'Front-row center view, transferring due to travel.'
      }, custToken);
      console.log(`🌟 Listed Ticket #${ticketToResell.id} on P2P Resale Marketplace for €${resaleRes.data?.resalePrice || 12.50}!`);
    }

    // Booking 3: Another seat for Resale demonstration
    const b3 = await post('/api/bookings', {
      screeningId,
      seatIds: [availableSeats[3].id],
      holderName: 'Diana Prince'
    }, custToken);
    if (b3.data?.tickets?.[0]) {
      const ticketToResell2 = b3.data.tickets[0];
      await post('/api/resale/list', {
        ticketId: ticketToResell2.id,
        resalePrice: (targetScreening?.price || 15.0) - 1.00,
        notes: 'Great audio acoustics in middle aisle.'
      }, custToken);
      console.log(`🌟 Listed Ticket #${ticketToResell2.id} on P2P Resale Marketplace!`);
    }
  }

  // 4. Create In-Seat Snack Orders (Pending & Preparing for Staff KDS view)
  const menuRes = await get('/api/concessions/menu');
  const menu = menuRes.data || [];
  if (menu.length >= 3) {
    // Order A: PENDING
    const o1 = await post('/api/concessions/orders', {
      deliveryType: 'IN_SEAT',
      ticketId: createdTickets[0]?.id || null,
      notes: 'Please bring extra napkins with the popcorn.',
      items: [
        { itemId: menu[0].id, quantity: 2, options: 'Large Sweet' },
        { itemId: menu[1].id, quantity: 2, options: 'Zero Sugar' }
      ]
    }, custToken);
    console.log(`🍿 Created In-Seat Snack Order #${o1.data?.orderNumber} (PENDING) for €${o1.data?.totalAmount}.`);

    // Order B: PREPARING
    const o2 = await post('/api/concessions/orders', {
      deliveryType: 'IN_SEAT',
      ticketId: createdTickets[1]?.id || null,
      notes: 'Seat delivery upon screening start.',
      items: [
        { itemId: menu[2].id, quantity: 1, options: 'Warm Melted Cheddar' }
      ]
    }, custToken);
    if (o2.data?.id) {
      await request({
        path: `/api/concessions/orders/${o2.data.id}/status`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + adminToken
        }
      }, { status: 'PREPARING' });
      console.log(`🍿 Created In-Seat Snack Order #${o2.data.orderNumber} updated to (PREPARING) for Kitchen Display System.`);
    }
  }

  // 5. Mint Commemorative NFT Ticket Stubs (POAP)
  // Check ticket #3 (which is USED and validated at gate)
  const nftClaimRes = await post('/api/nft-stubs/claim/3', {}, custToken);
  if (nftClaimRes.status === 201) {
    console.log(`🏆 Minted Commemorative NFT Stub #${nftClaimRes.data?.tokenId} for Ticket #3 (${nftClaimRes.data?.movieTitle})!`);
  } else {
    console.log(`ℹ️ NFT Stub claim status: HTTP ${nftClaimRes.status} (${nftClaimRes.data?.message || 'Already claimed or not eligible'})`);
  }

  console.log('\n========================================================');
  console.log('🎉 RICH SAMPLE DATA SEEDING COMPLETE!');
  console.log('   - 2 Active P2P Resale Listings in /resale');
  console.log('   - Multiple Active Tickets in /customer/tickets');
  console.log('   - Live Kitchen Display Orders in /admin/concessions');
  console.log('   - Minted POAP NFT Collectible in /customer/nft-stubs');
  console.log('   - Immutable On-Chain Audit Transactions in /admin/blockchain');
  console.log('========================================================');
}

seedData().catch(console.error);
