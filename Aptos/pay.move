module ticket::nft_tickets {
    use std::signer;
    use std::vector;
    use std::option;
    use std::string;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    
    const EINVALID_PAYMENT_AMOUNT: u64 = 1;
    const ETICKET_NOT_FOUND: u64 = 2;
    const EMOVIE_ALREADY_EXISTS: u64 = 3;
    const EPRICE_TOO_HIGH: u64 = 4;
    const EMARKET_NOT_INITIALIZED: u64 = 5;
    const EINSUFFICIENT_FUNDS: u64 = 6;

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

    struct MarketTicket has store, drop {
        id: u64,
        movie: vector<u8>,
        seat: vector<u8>,
        owner: address,
        price: u64,
        ogprice: u64,
    }

    struct MarketTickets has key, store {
        tickets: vector<MarketTicket>,
    }

    public entry fun init_market(account: &signer) {
        let organizer = signer::address_of(account);
        move_to(account, MarketTickets { tickets: vector::empty<MarketTicket>() });
    }

    public entry fun listNewTicket(
        account: &signer,
        id: u64,
        movie: vector<u8>,
        seat: vector<u8>,
        price: u64,
        ogprice: u64,
        organizer: address
    ) acquires UserTickets, MarketTickets {
        let owner = signer::address_of(account);

        assert!(price <= 2 * ogprice, EPRICE_TOO_HIGH);

        assert!(exists<UserTickets>(owner), ETICKET_NOT_FOUND);
        let user_tickets = borrow_global_mut<UserTickets>(owner);
        
        let len = vector::length(&user_tickets.tickets);
        let found = false;
        let ticket_index = 0;

        // Find the ticket in user's storage
        while (ticket_index < len) {
            let ticket_ref = vector::borrow(&user_tickets.tickets, ticket_index);
            if (ticket_ref.id == id && string::utf8(ticket_ref.movie) == string::utf8(movie) 
                && string::utf8(ticket_ref.seat) == string::utf8(seat)) {
                found = true;
                break;
            };
            ticket_index = ticket_index + 1;
        };

        assert!(found, ETICKET_NOT_FOUND);

        // Remove the ticket from user storage
        let ticket = vector::swap_remove(&mut user_tickets.tickets, ticket_index);
        let market_tickets = borrow_global_mut<MarketTickets>(organizer);
        let new_market_ticket = MarketTicket { 
            id, 
            movie, 
            seat, 
            owner,
            price, 
            ogprice 
        };

        // Add ticket to market storage
        vector::push_back(&mut market_tickets.tickets, new_market_ticket);
    }


    public entry fun buy_market_ticket(
        buyer: &signer,
        ticket_id: u64,
        organizer: address
    ) acquires MarketTickets, UserTickets {
        let buyer_address = signer::address_of(buyer);
        
        // Ensure the market exists
        assert!(exists<MarketTickets>(organizer), EMARKET_NOT_INITIALIZED);
        
        let market = borrow_global_mut<MarketTickets>(organizer);
        let tickets = &mut market.tickets;
        
        let i = 0;
        let found = false;
        
        while (i < vector::length(tickets)) {
            let ticket = vector::borrow_mut(tickets, i);
            
            if (ticket.id == ticket_id) {
                found = true;
                break;
            };
            
            i = i + 1;
        };

        assert!(found, ETICKET_NOT_FOUND);
        
        let market_ticket = vector::remove(tickets, i); // Remove ticket from marketplace

        let total_price = market_ticket.price;
        
        // Ensure buyer has enough balance
        assert!(coin::balance<AptosCoin>(buyer_address) >= total_price, EINSUFFICIENT_FUNDS);
        
        let royalty = total_price / 10; // 10% to organizer
        let seller_amount = total_price - royalty; // 90% to original owner
        
        // Transfer 90% to original ticket owner
        coin::transfer<AptosCoin>(buyer, market_ticket.owner, seller_amount);
        
        // Transfer 10% to organizer
        coin::transfer<AptosCoin>(buyer, organizer, royalty);
        
        // Convert MarketTicket -> Ticket
        let new_ticket = Ticket {
            id: market_ticket.id,
            movie: market_ticket.movie,
            seat: market_ticket.seat,
            owner: buyer_address,
            price: market_ticket.ogprice // Use the original price
        };

        // Move ticket to buyer's account
        if (!exists<UserTickets>(buyer_address)) {
            move_to(buyer, UserTickets { tickets: vector::empty<Ticket>() });
        };
        
        let user_tickets = borrow_global_mut<UserTickets>(buyer_address);
        vector::push_back(&mut user_tickets.tickets, new_ticket);
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
    public fun get_movie_dates(owner: address): vector<vector<u8>> acquires MovieCollection {
        if (!exists<MovieCollection>(owner)) {
            return vector::empty<vector<u8>>();
        };
        let collection = borrow_global<MovieCollection>(owner);
        let dates = vector::empty<vector<u8>>();
        let len = vector::length(&collection.movies);
        let i = 0;
        while (i < len) {
            let movie = vector::borrow(&collection.movies, i);
            vector::push_back(&mut dates, movie.date);
            i = i + 1;
        };
        dates
    }

    #[view]
    public fun get_movie_locations(owner: address): vector<vector<u8>> acquires MovieCollection {
        if (!exists<MovieCollection>(owner)) {
            return vector::empty<vector<u8>>();
        };
        let collection = borrow_global<MovieCollection>(owner);
        let locations = vector::empty<vector<u8>>();
        let len = vector::length(&collection.movies);
        let i = 0;
        while (i < len) {
            let movie = vector::borrow(&collection.movies, i);
            vector::push_back(&mut locations, movie.location);
            i = i + 1;
        };
        locations
    }

    #[view]
    public fun get_movie_prices(owner: address): vector<u64> acquires MovieCollection {
        if (!exists<MovieCollection>(owner)) {
            return vector::empty<u64>();
        };
        let collection = borrow_global<MovieCollection>(owner);
        let prices = vector::empty<u64>();
        let len = vector::length(&collection.movies);
        let i = 0;
        while (i < len) {
            let movie = vector::borrow(&collection.movies, i);
            vector::push_back(&mut prices, movie.price);
            i = i + 1;
        };
        prices
    }

    #[view]
    public fun get_movie_image_urls(owner: address): vector<vector<u8>> acquires MovieCollection {
        if (!exists<MovieCollection>(owner)) {
            return vector::empty<vector<u8>>();
        };
        let collection = borrow_global<MovieCollection>(owner);
        let urls = vector::empty<vector<u8>>();
        let len = vector::length(&collection.movies);
        let i = 0;
        while (i < len) {
            let movie = vector::borrow(&collection.movies, i);
            vector::push_back(&mut urls, movie.imageUrl);
            i = i + 1;
        };
        urls
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

    #[view]
    /// Get all ticket IDs listed in the market
    public fun get_market_ticket_ids(organizer: address): vector<u64> acquires MarketTickets {
        assert!(exists<MarketTickets>(organizer), EMARKET_NOT_INITIALIZED);
        let market_tickets = borrow_global<MarketTickets>(organizer);
        
        let ids = vector::empty<u64>();
        let len = vector::length(&market_tickets.tickets);
        let i = 0;

        while (i < len) {
            let ticket = vector::borrow(&market_tickets.tickets, i);
            vector::push_back(&mut ids, ticket.id);
            i = i + 1;
        };
        ids
    }

    #[view]
    public fun get_market_ticket_movies(organizer: address): vector<vector<u8>> acquires MarketTickets {
        assert!(exists<MarketTickets>(organizer), EMARKET_NOT_INITIALIZED);
        let market_tickets = borrow_global<MarketTickets>(organizer);

        let movies = vector::empty<vector<u8>>();
        let len = vector::length(&market_tickets.tickets);
        let i = 0;

        while (i < len) {
            let ticket = vector::borrow(&market_tickets.tickets, i);
            vector::push_back(&mut movies, ticket.movie);
            i = i + 1;
        };
        movies
    }

    #[view]
    public fun get_market_ticket_seats(organizer: address): vector<vector<u8>> acquires MarketTickets {
        assert!(exists<MarketTickets>(organizer), EMARKET_NOT_INITIALIZED);
        let market_tickets = borrow_global<MarketTickets>(organizer);

        let seats = vector::empty<vector<u8>>();
        let len = vector::length(&market_tickets.tickets);
        let i = 0;

        while (i < len) {
            let ticket = vector::borrow(&market_tickets.tickets, i);
            vector::push_back(&mut seats, ticket.seat);
            i = i + 1;
        };
        seats
    }

    #[view]
    public fun get_market_ticket_prices(organizer: address): vector<u64> acquires MarketTickets {
        assert!(exists<MarketTickets>(organizer), EMARKET_NOT_INITIALIZED);
        let market_tickets = borrow_global<MarketTickets>(organizer);

        let prices = vector::empty<u64>();
        let len = vector::length(&market_tickets.tickets);
        let i = 0;

        while (i < len) {
            let ticket = vector::borrow(&market_tickets.tickets, i);
            vector::push_back(&mut prices, ticket.price);
            i = i + 1;
        };
        prices
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