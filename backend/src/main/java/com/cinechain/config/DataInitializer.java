package com.cinechain.config;

import com.cinechain.entity.*;
import com.cinechain.enums.Role;
import com.cinechain.enums.SeatType;
import com.cinechain.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final MovieRepository movieRepository;
    private final CinemaRepository cinemaRepository;
    private final HallRepository hallRepository;
    private final SeatRepository seatRepository;
    private final ScreeningRepository screeningRepository;
    private final com.cinechain.repository.ConcessionItemRepository concessionItemRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.email:admin@cinechain.com}")
    private String adminEmail;

    @Value("${admin.password:Admin@123}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        initAdmin();
        initConcessions();
        if (movieRepository.count() == 0) {
            log.info("Database is empty, initializing sample movies, cinemas, halls, seats, screenings...");
            List<Movie> movies = initMovies();
            List<Cinema> cinemas = initCinemas();
            List<Hall> halls = initHallsAndSeats(cinemas);
            initScreenings(movies, halls);
            log.info("Sample data initialization completed successfully!");
        }
    }

    private void initAdmin() {
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .firstName("System")
                    .lastName("Administrator")
                    .email(adminEmail.toLowerCase().trim())
                    .password(passwordEncoder.encode(adminPassword))
                    .role(Role.ADMIN)
                    .enabled(true)
                    .build();
            userRepository.save(admin);
            log.info("Default admin user created: {}", adminEmail);
        }

        // Also create a sample customer for quick testing if none exists
        String sampleCustomerEmail = "customer@cinechain.com";
        if (!userRepository.existsByEmail(sampleCustomerEmail)) {
            User customer = User.builder()
                    .firstName("John")
                    .lastName("Doe")
                    .email(sampleCustomerEmail)
                    .password(passwordEncoder.encode("Password@123"))
                    .role(Role.CUSTOMER)
                    .enabled(true)
                    .build();
            userRepository.save(customer);
            log.info("Default test customer created: {}", sampleCustomerEmail);
        }
    }

    private List<Movie> initMovies() {
        List<Movie> movies = List.of(
                Movie.builder()
                        .title("Inception")
                        .description("A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.")
                        .genre("Sci-Fi")
                        .language("English")
                        .durationMinutes(148)
                        .posterUrl("https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80")
                        .trailerUrl("https://www.youtube.com/watch?v=YoHD9XEInc0")
                        .releaseDate(LocalDate.of(2010, 7, 16))
                        .rating(8.8)
                        .status("NOW_SHOWING")
                        .build(),

                Movie.builder()
                        .title("The Dark Knight")
                        .description("When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.")
                        .genre("Action")
                        .language("English")
                        .durationMinutes(152)
                        .posterUrl("https://images.unsplash.com/photo-1509281373149-e957c6296406?w=500&q=80")
                        .trailerUrl("https://www.youtube.com/watch?v=EXeTwQWrcwY")
                        .releaseDate(LocalDate.of(2008, 7, 18))
                        .rating(9.0)
                        .status("NOW_SHOWING")
                        .build(),

                Movie.builder()
                        .title("Interstellar")
                        .description("When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.")
                        .genre("Sci-Fi")
                        .language("English")
                        .durationMinutes(169)
                        .posterUrl("https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&q=80")
                        .trailerUrl("https://www.youtube.com/watch?v=zSWdZVtXT7E")
                        .releaseDate(LocalDate.of(2014, 11, 7))
                        .rating(8.7)
                        .status("NOW_SHOWING")
                        .build(),

                Movie.builder()
                        .title("Dune: Part Two")
                        .description("Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.")
                        .genre("Sci-Fi")
                        .language("English")
                        .durationMinutes(166)
                        .posterUrl("https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&q=80")
                        .trailerUrl("https://www.youtube.com/watch?v=Way9Dexny3w")
                        .releaseDate(LocalDate.of(2024, 3, 1))
                        .rating(8.6)
                        .status("NOW_SHOWING")
                        .build(),

                Movie.builder()
                        .title("Oppenheimer")
                        .description("The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.")
                        .genre("Biography")
                        .language("English")
                        .durationMinutes(180)
                        .posterUrl("https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=500&q=80")
                        .trailerUrl("https://www.youtube.com/watch?v=uYPbbksJxIg")
                        .releaseDate(LocalDate.of(2023, 7, 21))
                        .rating(8.9)
                        .status("NOW_SHOWING")
                        .build()
        );

        return movieRepository.saveAll(movies);
    }

    private List<Cinema> initCinemas() {
        List<Cinema> cinemas = List.of(
                Cinema.builder()
                        .name("CineChain Paris")
                        .address("15 Boulevard des Capucines")
                        .city("Paris")
                        .phone("+33 1 42 68 00 00")
                        .email("paris@cinechain.com")
                        .imageUrl("https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80")
                        .build(),

                Cinema.builder()
                        .name("CineChain Lyon")
                        .address("10 Rue Bellecour")
                        .city("Lyon")
                        .phone("+33 4 78 00 00 00")
                        .email("lyon@cinechain.com")
                        .imageUrl("https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&q=80")
                        .build()
        );

        return cinemaRepository.saveAll(cinemas);
    }

    private List<Hall> initHallsAndSeats(List<Cinema> cinemas) {
        List<Hall> allHalls = new ArrayList<>();

        for (Cinema cinema : cinemas) {
            Hall hall1 = Hall.builder()
                    .name("Hall 1 - IMAX")
                    .totalCapacity(80)
                    .cinema(cinema)
                    .build();
            Hall hall2 = Hall.builder()
                    .name("Hall 2 - Dolby Atmos")
                    .totalCapacity(80)
                    .cinema(cinema)
                    .build();

            Hall savedH1 = hallRepository.save(hall1);
            Hall savedH2 = hallRepository.save(hall2);

            createSeatsForHall(savedH1);
            createSeatsForHall(savedH2);

            allHalls.add(savedH1);
            allHalls.add(savedH2);
        }

        return allHalls;
    }

    private void createSeatsForHall(Hall hall) {
        // Rows A-J (10 rows), seats 1-8 (8 seats per row) = 80 seats
        char[] rows = {'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'};
        List<Seat> seats = new ArrayList<>();

        for (char row : rows) {
            for (int num = 1; num <= 8; num++) {
                SeatType type = SeatType.STANDARD;
                if (row == 'I' || row == 'J') {
                    type = SeatType.VIP;
                } else if (row >= 'E' && row <= 'H') {
                    type = SeatType.PREMIUM;
                }

                Seat seat = Seat.builder()
                        .hall(hall)
                        .rowLabel(String.valueOf(row))
                        .seatNumber(num)
                        .seatType(type)
                        .build();
                seats.add(seat);
            }
        }

        seatRepository.saveAll(seats);
    }

    private void initScreenings(List<Movie> movies, List<Hall> halls) {
        List<Screening> screenings = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now().withMinute(0).withSecond(0).withNano(0);

        // Screenings for the next 7 days
        for (int day = 0; day < 7; day++) {
            LocalDateTime dayBase = now.plusDays(day);

            int movieIndex = 0;
            for (Hall hall : halls) {
                // Screening 1: 14:00 - 16:30
                Movie movie1 = movies.get(movieIndex % movies.size());
                screenings.add(Screening.builder()
                        .movie(movie1)
                        .hall(hall)
                        .startTime(dayBase.withHour(14).withMinute(0))
                        .endTime(dayBase.withHour(16).withMinute(30))
                        .price(new BigDecimal("12.50"))
                        .status("SCHEDULED")
                        .build());

                // Screening 2: 17:30 - 20:00
                Movie movie2 = movies.get((movieIndex + 1) % movies.size());
                screenings.add(Screening.builder()
                        .movie(movie2)
                        .hall(hall)
                        .startTime(dayBase.withHour(17).withMinute(30))
                        .endTime(dayBase.withHour(20).withMinute(0))
                        .price(new BigDecimal("14.00"))
                        .status("SCHEDULED")
                        .build());

                // Screening 3: 20:30 - 23:00
                Movie movie3 = movies.get((movieIndex + 2) % movies.size());
                screenings.add(Screening.builder()
                        .movie(movie3)
                        .hall(hall)
                        .startTime(dayBase.withHour(20).withMinute(30))
                        .endTime(dayBase.withHour(23).withMinute(0))
                        .price(new BigDecimal("15.50"))
                        .status("SCHEDULED")
                        .build());

                movieIndex++;
            }
        }

        screeningRepository.saveAll(screenings);
    }

    private void initConcessions() {
        if (concessionItemRepository.count() > 0) {
            return;
        }
        log.info("Seeding gourmet cinema concession items...");
        List<com.cinechain.entity.ConcessionItem> items = List.of(
                // COMBOS
                com.cinechain.entity.ConcessionItem.builder()
                        .name("CineChain Signature Royale")
                        .category(com.cinechain.enums.ConcessionCategory.COMBOS)
                        .description("Large Black Truffle Popcorn, 2 Artisanal Sodas & a Belgian Dark Chocolate Box. Served in luxury packaging.")
                        .price(new BigDecimal("18.50"))
                        .badge("Signature")
                        .calories(720)
                        .imageUrl("https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=600&auto=format&fit=crop&q=80")
                        .available(true)
                        .build(),
                com.cinechain.entity.ConcessionItem.builder()
                        .name("Duo Gourmet Screening Pack")
                        .category(com.cinechain.enums.ConcessionCategory.COMBOS)
                        .description("Medium Sweet & Salted Popcorn, 2 Draft Beverages & Loaded Warm Queso Nachos.")
                        .price(new BigDecimal("16.00"))
                        .badge("Best Value")
                        .calories(840)
                        .imageUrl("https://images.unsplash.com/photo-1512149177596-f817c7ef5d4c?w=600&auto=format&fit=crop&q=80")
                        .available(true)
                        .build(),
                com.cinechain.entity.ConcessionItem.builder()
                        .name("Solo Cinephile Treat")
                        .category(com.cinechain.enums.ConcessionCategory.COMBOS)
                        .description("Medium Clarified Butter Popcorn, chilled drink of choice & gourmet cinema candy.")
                        .price(new BigDecimal("11.50"))
                        .badge("Classic")
                        .calories(580)
                        .imageUrl("https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=80")
                        .available(true)
                        .build(),

                // POPCORN
                com.cinechain.entity.ConcessionItem.builder()
                        .name("Black Truffle & Parmigiano Popcorn")
                        .category(com.cinechain.enums.ConcessionCategory.POPCORN)
                        .description("Air-popped organic corn tossed with Italian black summer truffle oil, cracked sea salt and 24-month Parmigiano Reggiano.")
                        .price(new BigDecimal("8.50"))
                        .badge("Chef's Special")
                        .calories(390)
                        .imageUrl("https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=600&auto=format&fit=crop&q=80")
                        .available(true)
                        .build(),
                com.cinechain.entity.ConcessionItem.builder()
                        .name("Salted Caramel & Brittany Sea Salt")
                        .category(com.cinechain.enums.ConcessionCategory.POPCORN)
                        .description("Handcrafted small-batch caramel popcorn infused with French Brittany fleur de sel.")
                        .price(new BigDecimal("7.00"))
                        .badge("Bestseller")
                        .calories(420)
                        .imageUrl("https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80")
                        .available(true)
                        .build(),
                com.cinechain.entity.ConcessionItem.builder()
                        .name("Traditional Golden Clarified Butter")
                        .category(com.cinechain.enums.ConcessionCategory.POPCORN)
                        .description("Classic theater popcorn popped in coconut oil and layered with warm clarified European butter.")
                        .price(new BigDecimal("6.00"))
                        .badge("Organic")
                        .calories(340)
                        .imageUrl("https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=600&auto=format&fit=crop&q=80")
                        .available(true)
                        .build(),

                // HOT_BITES
                com.cinechain.entity.ConcessionItem.builder()
                        .name("Artisan Loaded Nachos with Molten Queso")
                        .category(com.cinechain.enums.ConcessionCategory.HOT_BITES)
                        .description("Stone-ground blue and yellow corn tortilla chips with warm Monterey Jack queso, fresh pico de gallo, jalapeños, and guacamole.")
                        .price(new BigDecimal("9.50"))
                        .badge("Hot & Crisp")
                        .calories(540)
                        .imageUrl("https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600&auto=format&fit=crop&q=80")
                        .available(true)
                        .build(),
                com.cinechain.entity.ConcessionItem.builder()
                        .name("Mini Wagyu Beef Brioche Sliders (2 pcs)")
                        .category(com.cinechain.enums.ConcessionCategory.HOT_BITES)
                        .description("Seared Wagyu beef patties with melted Gruyère cheese, caramelized onions and truffle aioli on toasted brioche.")
                        .price(new BigDecimal("12.50"))
                        .badge("Luxury Bite")
                        .calories(610)
                        .imageUrl("https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80")
                        .available(true)
                        .build(),
                com.cinechain.entity.ConcessionItem.builder()
                        .name("Truffle & Herb Fries with Garlic Aioli")
                        .category(com.cinechain.enums.ConcessionCategory.HOT_BITES)
                        .description("Thick-cut skin-on fries tossed in rosemary and white truffle oil, served with homemade garlic aioli.")
                        .price(new BigDecimal("7.50"))
                        .badge("Vegetarian")
                        .calories(440)
                        .imageUrl("https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80")
                        .available(true)
                        .build(),

                // BEVERAGES
                com.cinechain.entity.ConcessionItem.builder()
                        .name("Hibiscus Berry Sparkling Botanical Soda")
                        .category(com.cinechain.enums.ConcessionCategory.BEVERAGES)
                        .description("Cold-pressed organic hibiscus flowers infused with fresh berries, lime, and sparkling mountain water.")
                        .price(new BigDecimal("5.00"))
                        .badge("Zero Sugar")
                        .calories(15)
                        .imageUrl("https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&auto=format&fit=crop&q=80")
                        .available(true)
                        .build(),
                com.cinechain.entity.ConcessionItem.builder()
                        .name("Cold Brew Nitro Float")
                        .category(com.cinechain.enums.ConcessionCategory.BEVERAGES)
                        .description("Velvety nitro cold brew coffee topped with a scoop of Madagascar vanilla bean gelato.")
                        .price(new BigDecimal("6.50"))
                        .badge("Craft Cold Brew")
                        .calories(180)
                        .imageUrl("https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80")
                        .available(true)
                        .build(),
                com.cinechain.entity.ConcessionItem.builder()
                        .name("Artisan Draft Soda (Cola / Blood Orange)")
                        .category(com.cinechain.enums.ConcessionCategory.BEVERAGES)
                        .description("Cane-sugar craft fountain soda served ice cold with unlimited free refills during screening.")
                        .price(new BigDecimal("4.50"))
                        .badge("Free Refill")
                        .calories(140)
                        .imageUrl("https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80")
                        .available(true)
                        .build(),
                com.cinechain.entity.ConcessionItem.builder()
                        .name("San Pellegrino Sparkling Water (500ml)")
                        .category(com.cinechain.enums.ConcessionCategory.BEVERAGES)
                        .description("Crisp Italian natural sparkling mineral water served chilled with lemon wedge.")
                        .price(new BigDecimal("4.00"))
                        .badge("Chilled Glass")
                        .calories(0)
                        .imageUrl("https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80")
                        .available(true)
                        .build(),

                // SNACKS
                com.cinechain.entity.ConcessionItem.builder()
                        .name("Belgian 72% Dark Chocolate Fleur de Sel Bites")
                        .category(com.cinechain.enums.ConcessionCategory.SNACKS)
                        .description("Artisan single-origin Belgian dark chocolate medallions studded with toasted almonds and sea salt crystals.")
                        .price(new BigDecimal("5.50"))
                        .badge("Artisan")
                        .calories(270)
                        .imageUrl("https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&auto=format&fit=crop&q=80")
                        .available(true)
                        .build(),
                com.cinechain.entity.ConcessionItem.builder()
                        .name("Gourmet Fruit Juice Cinema Gummies")
                        .category(com.cinechain.enums.ConcessionCategory.SNACKS)
                        .description("Assorted natural fruit juice gummies with sour fizz ribbons, made without artificial coloring.")
                        .price(new BigDecimal("4.50"))
                        .badge("Vegan")
                        .calories(210)
                        .imageUrl("https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&auto=format&fit=crop&q=80")
                        .available(true)
                        .build()
        );
        concessionItemRepository.saveAll(items);
        log.info("Successfully seeded {} gourmet concession items!", items.size());
    }
}
