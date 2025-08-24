#include "ReputationSystem.h"
#include "Character.h"
#include "json.hpp"

#include <fstream>
#include <iomanip> // For std::setw
#include <string>

using json = nlohmann::json;

// Helper function to convert ERace enum to its string representation.
// This is kept local to this cpp file as it's an implementation detail.
namespace {
    std::string RaceToString(Game::Race race) {
        switch (race) {
            case Game::ERace::Human:   return "Human";
            case Game::ERace::Dwarf:   return "Dwarf";
            case Game::ERace::Elf:     return "Elf";
            case Game::ERace::Orc:     return "Orc";
            case Game::ERace::Goliath: return "Goliath";
            case Game::ERace::Fae:     return "Fae";
            default:                 return "Unknown";
        }
    }
}

void ReputationSystem::OnMurderWitnessed(Game::PlayerCharacter& character, Game::Race witnessRace) {
    character.updateReputation(witnessRace, -100);
}

void ReputationSystem::OnGoodDeed(Game::PlayerCharacter& character, Game::Race beneficiaryRace) {
    character.updateReputation(beneficiaryRace, 10);
}

bool ReputationSystem::IsBanned(const Game::PlayerCharacter& character, Game::Race race) {
    return character.getReputation(race) < 0;
}

void ReputationSystem::SaveReputationToJSON(const Game::PlayerCharacter& character, const std::string& filepath) {
    json reputation_data;

    // Iterate through all defined races and get the character's reputation for each.
    for (int i = static_cast<int>(Game::ERace::Human); i <= static_cast<int>(Game::ERace::Fae); ++i) {
        Game::Race current_race = static_cast<Game::Race>(i);
        std::string race_name = RaceToString(current_race);
        reputation_data[race_name] = character.getReputation(current_race);
    }

    // Write the JSON object to the specified file.
    std::ofstream o(filepath);
    if (o.is_open()) {
        o << std::setw(4) << reputation_data << std::endl;
    }
}
