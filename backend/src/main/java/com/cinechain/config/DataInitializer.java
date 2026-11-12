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
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.email:admin@cinechain.com}")
    private String adminEmail;

    @Value("${admin.password:Admin@123}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        initAdmin();
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
}
