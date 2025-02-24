module ticket::nft_tickets {
    use std::signer;
    use std::vector;
    use std::option;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    
    const EINVALID_PAYMENT_AMOUNT: u64 = 1;
    const ETICKET_NOT_FOUND: u64 = 2;
    const EMOVIE_ALREADY_EXISTS: u64 = 3;

    struct Ticket has store, drop {
        id: u64,
        movie: vector<u8>,
        seat: vector<u8>,
        owner: address,
        price: u64, // Changed from vector<u8> to u64
    }

    struct UserTickets has key, store {
        tickets: vector<Ticket>,
    }

    struct Movie has store, drop {
        title: vector<u8>,
        date: vector<u8>,
        location: vector<u8>,
        price: u64, // Changed from vector<u8> to u64
        imageUrl: vector<u8>,
        tickets: vector<Ticket>,
    }

    struct MovieCollection has key, store {
        movies: vector<Movie>,
    }

    /// Create a ticket for a movie
    public entry fun create_ticket(
        account: &signer,
        id: u64,
        movie: vector<u8>,
        seat: vector<u8>,
        price: u64, // Now it's u64
        organizer: address
    ) acquires UserTickets {
        let owner = signer::address_of(account);

        // Ensure the buyer has enough balance
        assert!(coin::balance<AptosCoin>(owner) >= price, EINVALID_PAYMENT_AMOUNT);

        // Transfer funds from buyer to organizer
        coin::transfer<AptosCoin>(account, organizer, price);

        let new_ticket = Ticket { id, movie, seat, owner, price };

        if (!exists<UserTickets>(owner)) {
            move_to(account, UserTickets { tickets: vector::empty<Ticket>() });
        };

        let user_tickets = borrow_global_mut<UserTickets>(owner);
        vector::push_back(&mut user_tickets.tickets, new_ticket);
    }

    /// Purchase a ticket from another user
    public entry fun purchase_ticket(
        buyer: &signer,
        seller: address,
        ticket_id: u64,
        amount: u64
    ) acquires UserTickets {
        let buyer_address = signer::address_of(buyer);
        let seller_tickets = borrow_global_mut<UserTickets>(seller);

        let index = find_ticket_index(&seller_tickets.tickets, ticket_id);
        assert!(option::is_some(&index), ETICKET_NOT_FOUND);

        let ticket = vector::swap_remove(&mut seller_tickets.tickets, *option::borrow(&index));

        // Ensure the buyer pays the correct price
        assert!(ticket.price == amount, EINVALID_PAYMENT_AMOUNT);

        coin::transfer<AptosCoin>(buyer, seller, amount);

        if (!exists<UserTickets>(buyer_address)) {
            move_to(buyer, UserTickets { tickets: vector::empty<Ticket>() });
        };

        let buyer_tickets = borrow_global_mut<UserTickets>(buyer_address);
        ticket.owner = buyer_address;
        vector::push_back(&mut buyer_tickets.tickets, ticket);
    }

    /// Store a new movie under an account's collection
    public entry fun store_movie(
        account: &signer,
        title: vector<u8>,
        date: vector<u8>,
        location: vector<u8>,
        price: u64, // Changed from vector<u8> to u64
        imageUrl: vector<u8>,
    ) acquires MovieCollection {
        let owner = signer::address_of(account);

        if (!exists<MovieCollection>(owner)) {
            move_to(account, MovieCollection { movies: vector::empty<Movie>() });
        };

        let collection = borrow_global_mut<MovieCollection>(owner);
        let new_movie = Movie { title, date, location, price, imageUrl, tickets: vector::empty<Ticket>() };
        vector::push_back(&mut collection.movies, new_movie);
    }

    #[view]
    public fun get_movie_titles(owner: address): vector<vector<u8>> acquires MovieCollection {
        if (!exists<MovieCollection>(owner)) {
            return vector::empty<vector<u8>>();
        };
        let collection = borrow_global<MovieCollection>(owner);
        let titles = vector::empty<vector<u8>>();
        let len = vector::length(&collection.movies);
        let i = 0;
        while (i < len) {
            let movie = vector::borrow(&collection.movies, i);
            vector::push_back(&mut titles, movie.title);
            i = i + 1;
        };
        titles
    }

    #[view]
    public fun get_user_ticket_movies(owner: address): vector<vector<u8>> acquires UserTickets {
        if (!exists<UserTickets>(owner)) {
            return vector::empty<vector<u8>>();
        };
        let user_tickets = borrow_global<UserTickets>(owner);
        let movie_names = vector::empty<vector<u8>>();
        let len = vector::length(&user_tickets.tickets);
        let i = 0;
        while (i < len) {
            let ticket = vector::borrow(&user_tickets.tickets, i);
            vector::push_back(&mut movie_names, ticket.movie);
            i = i + 1;
        };
        movie_names
    }

    #[view]
    public fun get_user_ticket_seats(owner: address): vector<vector<u8>> acquires UserTickets {
        if (!exists<UserTickets>(owner)) {
            return vector::empty<vector<u8>>();
        };
        let user_tickets = borrow_global<UserTickets>(owner);
        let seat_numbers = vector::empty<vector<u8>>();
        let len = vector::length(&user_tickets.tickets);
        let i = 0;
        while (i < len) {
            let ticket = vector::borrow(&user_tickets.tickets, i);
            vector::push_back(&mut seat_numbers, ticket.seat);
            i = i + 1;
        };
        seat_numbers
    }

    #[view]
    public fun get_user_ticket_prices(owner: address): vector<u64> acquires UserTickets {
        if (!exists<UserTickets>(owner)) {
            return vector::empty<u64>();
        };
        let user_tickets = borrow_global<UserTickets>(owner);
        let prices = vector::empty<u64>();
        let len = vector::length(&user_tickets.tickets);
        let i = 0;
        while (i < len) {
            let ticket = vector::borrow(&user_tickets.tickets, i);
            vector::push_back(&mut prices, ticket.price);
            i = i + 1;
        };
        prices
    }

    #[view]
    public fun get_user_ticket_ids(owner: address): vector<u64> acquires UserTickets {
        if (!exists<UserTickets>(owner)) {
            return vector::empty<u64>();
        };
        let user_tickets = borrow_global<UserTickets>(owner);
        let ids = vector::empty<u64>();
        let len = vector::length(&user_tickets.tickets);
        let i = 0;
        while (i < len) {
            let ticket = vector::borrow(&user_tickets.tickets, i);
            vector::push_back(&mut ids, ticket.id);
            i = i + 1;
        };
        ids
    }

    fun find_ticket_index(tickets: &vector<Ticket>, id: u64): option::Option<u64> {
        let len = vector::length(tickets);
        let i = 0;
        while (i < len) {
            if (vector::borrow(tickets, i).id == id) {
                return option::some(i);
            };
            i = i + 1;
        };
        option::none()
    }
}