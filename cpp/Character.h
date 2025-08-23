#ifndef CHARACTER_H
#define CHARACTER_H

#include "DataTypes.h"
#include "Formulas.h"
#include "Items.h"
#include "MagicSystem.h"

#include <string>
#include <vector>
#include <map>
#include <numeric>
#include <algorithm>

namespace Game {

class PlayerCharacter {
public:
    PlayerCharacter(Race race, PlayerStats baseStats)
        : race(race), baseStats(baseStats), chosenElement(ElementType::Fire), chosenEntropy(EntropySchool::Radiance) {

        // Initialize all AP-costing skills from the "Action Skill System" document
        skills = {
            {"ArmorTraining", 0}, {"BlockingAndShields", 0}, {"Sword", 0},
            {"Axe", 0}, {"Dagger", 0}, {"Hammer", 0}, {"Polesword", 0},
            {"Poleaxe", 0}, {"Spear", 0}, {"MountedCombat", 0},
            {"MountedArchery", 0}, {"MountedMagery", 0}, {"Anatomy", 0},
            {"BeastControl", 0}, {"Taming", 0}, {"Fire", 0}, {"Water", 0},
            {"Earth", 0}, {"Wind", 0}, {"Radiance", 0}, {"Void", 0},
            {"Stealth", 0}, {"MeleeAmbush", 0}, {"RangedAmbush", 0}, {"ElementalAmbush", 0}
        };

        applyRacialProficiencies();
    }

    // --- Getters and Setters ---
    bool setSkill(const std::string& skillName, int value) {
        if (!skills.count(skillName)) return false;

        int newSkillAP = std::max(0, std::min(100, value));

        if (skillName == "MeleeAmbush" || skillName == "RangedAmbush" || skillName == "ElementalAmbush") {
            if (skills.count("Stealth")) {
                newSkillAP = std::min(newSkillAP, skills.at("Stealth"));
            }
        }

        int currentTotalAP = getTotalAP();
        int currentSkillAP = skills[skillName];
        if ((currentTotalAP - currentSkillAP + newSkillAP) > MAX_ACTION_POINTS) {
            return false; // Not enough AP
        }

        if (isElementalSkill(skillName) && getElementType(skillName) != chosenElement) return false;
        if (isEntropySkill(skillName) && getEntropySchool(skillName) != chosenEntropy) return false;

        skills[skillName] = newSkillAP;

        if (skillName == "Stealth") {
            if (skills.count("MeleeAmbush") && skills.at("MeleeAmbush") > newSkillAP) {
                skills["MeleeAmbush"] = newSkillAP;
            }
            if (skills.count("RangedAmbush") && skills.at("RangedAmbush") > newSkillAP) {
                skills["RangedAmbush"] = newSkillAP;
            }
            if (skills.count("ElementalAmbush") && skills.at("ElementalAmbush") > newSkillAP) {
                skills["ElementalAmbush"] = newSkillAP;
            }
        }

        return true;
    }

    void equipArmor(const std::string& slot, const Armor& piece) {
        equippedArmor[slot] = piece;
    }

    void equipWeapon(const Weapon& w) {
        equippedWeapon = &w;
    }

    void equipRing(const Ring& ring, int slot) {
        if (slot >= 0 && slot < 2) {
            equippedRings[slot] = &ring;
        }
    }

    void equipEarring(const Earring& earring, int slot) {
        if (slot >= 0 && slot < 2) {
            equippedEarrings[slot] = &earring;
        }
    }

    void equipAmulet(const Amulet& amulet) {
        equippedAmulet = &amulet;
    }

    // --- Derived Stats and Calculations ---
    PlayerStats getEffectiveStats() const {
        PlayerStats effectiveStats = baseStats;
        static const std::map<Race, PlayerStats> raceMods = {
            {Race::Human,   {2, 2, 2, 2}}, {Race::Dwarf,   {0, 4, 0, 4}},
            {Race::Elf,     {0, 4, 4, 0}}, {Race::Orc,     {4, 4, 0, 0}},
            {Race::Goliath, {8, -4, -8, 0}}, {Race::Fae,     {-8, 0, 8, -4}}
        };

        if(raceMods.count(race)) {
            const auto& mod = raceMods.at(race);
            effectiveStats.STR = std::max(0, std::min(100, baseStats.STR + mod.STR));
            effectiveStats.DEX = std::max(0, std::min(100, baseStats.DEX + mod.DEX));
            effectiveStats.INT = std::max(0, std::min(100, baseStats.INT + mod.INT));
            effectiveStats.PSY = std::max(0, std::min(100, baseStats.PSY + mod.PSY));
        }

        // Apply jewelry stats
        for (const auto& ring : equippedRings) {
            if (ring) {
                if (ring->getModifiedStat() == "Intelligence") {
                    effectiveStats.INT += ring->getModifierValue();
                } else if (ring->getModifiedStat() == "Strength") {
                    effectiveStats.STR += ring->getModifierValue();
                }
            }
        }

        for (const auto& earring : equippedEarrings) {
            if (earring) {
                if (earring->getModifiedStat() == "Dexterity") {
                    effectiveStats.DEX += earring->getModifierValue();
                } else if (earring->getModifiedStat() == "Psyche") {
                    effectiveStats.PSY += earring->getModifierValue();
                }
            }
        }

        return effectiveStats;
    }

    Formulas::LoadoutResult getLoadout() const {
        std::vector<Formulas::ArmorSlotInfo> equipped;
        for (const auto& pair : equippedArmor) {
            equipped.push_back({pair.second.getArmorClass(), pair.second.getSlotFactor()});
        }
        return Formulas::CalculateLoadout(equipped);
    }

    int getTotalAP() const {
        return std::accumulate(skills.begin(), skills.end(), 0,
            [](int acc, const std::pair<std::string, int>& p) { return acc + p.second; });
    }

    int getEffectiveSkill(const std::string& skillName) const {
        if (!skills.count(skillName)) {
            return 0;
        }

        int effectiveSkill = skills.at(skillName);

        if (equippedAmulet && equippedAmulet->getModifiedSkill() == skillName) {
            effectiveSkill += equippedAmulet->getSkillIncrease();
        }

        return effectiveSkill;
    }

private:
    static constexpr int MAX_ACTION_POINTS = 500;

    Race race;
    PlayerStats baseStats;
    std::map<std::string, int> skills;

    std::map<std::string, Armor> equippedArmor;
    const Weapon* equippedWeapon = nullptr;
    const Ring* equippedRings[2] = {nullptr, nullptr};
    const Earring* equippedEarrings[2] = {nullptr, nullptr};
    const Amulet* equippedAmulet = nullptr;

    ElementType chosenElement;
    EntropySchool chosenEntropy;

    void applyRacialProficiencies() {
        static const std::map<Race, std::pair<std::string, std::string>> profs = {
            {Race::Human, {"Sword", "Fire"}}, {Race::Dwarf, {"Hammer", "Earth"}},
            {Race::Elf, {"RangedWeapons", "Water"}}, // Interpreting "Bow" as RangedWeapons
            {Race::Orc, {"Axe", "Wind"}}, {Race::Goliath, {"Spear", "Void"}},
            {Race::Fae, {"Dagger", "Radiance"}}
        };

        if (profs.count(race)) {
            const auto& prof = profs.at(race);
            if (skills.count(prof.first)) skills[prof.first] = 50;
            if (skills.count(prof.second)) {
                skills[prof.second] = 50;
                if(isElementalSkill(prof.second)) chosenElement = getElementType(prof.second);
                if(isEntropySkill(prof.second)) chosenEntropy = getEntropySchool(prof.second);
            }
        }
    }

    bool isElementalSkill(const std::string& n) const { return n=="Fire"||n=="Water"||n=="Earth"||n=="Wind"; }
    ElementType getElementType(const std::string& n) const {
        if(n=="Fire") return ElementType::Fire; if(n=="Water") return ElementType::Water;
        if(n=="Earth") return ElementType::Earth; return ElementType::Wind;
    }
    bool isEntropySkill(const std::string& n) const { return n == "Radiance" || n == "Void"; }
    EntropySchool getEntropySchool(const std::string& n) const {
        if(n=="Radiance") return EntropySchool::Radiance; return EntropySchool::Void;
    }
};

} // namespace Game

#endif // CHARACTER_H
