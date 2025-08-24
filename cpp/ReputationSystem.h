#pragma once

#include "DataTypes.h"

// Forward declare PlayerCharacter to avoid including the full Character.h in this header.
// This helps prevent circular dependencies.
namespace Game {
    class PlayerCharacter;
}

namespace ReputationSystem {
    /**
     * @brief Applies a reputation penalty for a witnessed murder.
     * @param character The character who committed the act.
     * @param witnessRace The race of the NPC who witnessed the act.
     */
    void OnMurderWitnessed(Game::PlayerCharacter& character, Game::Race witnessRace);

    /**
     * @brief Applies a reputation reward for a good deed.
     * @param character The character who performed the deed.
     * @param beneficiaryRace The race that benefits from the deed.
     */
    void OnGoodDeed(Game::PlayerCharacter& character, Game::Race beneficiaryRace);

    /**
     * @brief Checks if a character's reputation with a race is low enough to be banned.
     * @param character The character to check.
     * @param race The race to check against.
     * @return True if the character is banned, false otherwise.
     */
    bool IsBanned(const Game::PlayerCharacter& character, Game::Race race);

    /**
     * @brief Saves the character's current reputation with all races to a JSON file.
     * @param character The character whose reputation is being saved.
     * @param filepath The full path to the output JSON file.
     */
    void SaveReputationToJSON(const Game::PlayerCharacter& character, const std::string& filepath);
}
