/** Campagne complète. Coordonnées en cellules de 48 px ; origine en haut à gauche. */
export const LEVELS = [
  {
    "id": 1,
    "title": "La réserve oubliée",
    "subtitle": "Apprendre à entrer… et à ressortir.",
    "act": 1,
    "story": "Le collectionneur Vesper expose des œuvres confisquées à leurs propriétaires. Cette nuit, tu entres dans son musée pour les restituer. Mara, archiviste du quartier, te guide depuis la rue : « Commençons par la réserve. »",
    "epilogue": "Les étiquettes portent encore les noms des familles. Mara retrouve la première adresse. Ces œuvres vont enfin rentrer chez elles.",
    "hint": "Déplace-toi avec WASD ou les flèches ; tu peux aussi cliquer au sol. Approche des œuvres, puis rejoins la sortie.",
    "par": 55,
    "tiles": [
      "####################",
      "#..................#",
      "#..................#",
      "#....##.....##.....#",
      "#....##.....##.....#",
      "#....##.....##.....#",
      "#....##.....##.....#",
      "#....##.....##.....#",
      "#..................#",
      "#..................#",
      "#..................#",
      "####################"
    ],
    "player": {
      "x": 2,
      "y": 9
    },
    "exit": {
      "x": 17,
      "y": 9
    },
    "loot": [
      {
        "x": 3,
        "y": 2,
        "name": "Le jardin de Nour",
        "asset": "painting"
      },
      {
        "x": 10,
        "y": 5,
        "name": "L’oiseau de cuivre",
        "asset": "statue"
      },
      {
        "x": 16,
        "y": 2,
        "name": "La pierre des marées",
        "asset": "gem"
      }
    ],
    "guards": [],
    "lasers": [],
    "charges": {
      "decoy": 0,
      "emp": 0
    }
  },
  {
    "id": 2,
    "title": "La ronde de nuit",
    "subtitle": "Le regard du gardien a ses limites.",
    "act": 1,
    "story": "La première galerie est surveillée. Les gardiens travaillent ici sans connaître l’origine des collections. Mara insiste : « On ne blesse personne. Observe sa ronde et passe derrière lui. »",
    "epilogue": "Un portrait quitte son cadre de verre. Au dos, un enfant avait écrit : « Pour maman ». Vesper avait masqué la dédicace.",
    "hint": "Les cônes dorés montrent le regard des gardes. Les murs te cachent. Maintiens Maj pour avancer discrètement.",
    "par": 65,
    "tiles": [
      "####################",
      "#..................#",
      "#........#.........#",
      "#........#.........#",
      "#........#.........#",
      "#..................#",
      "#..................#",
      "#........#.........#",
      "#........#.........#",
      "#........#.........#",
      "#..................#",
      "####################"
    ],
    "player": {
      "x": 2,
      "y": 9
    },
    "exit": {
      "x": 2,
      "y": 2
    },
    "loot": [
      {
        "x": 4,
        "y": 4,
        "name": "Le portrait à la dédicace",
        "asset": "painting"
      },
      {
        "x": 16,
        "y": 9,
        "name": "La bague d’Aïcha",
        "asset": "gem"
      }
    ],
    "guards": [
      {
        "path": [
          {
            "x": 12,
            "y": 3
          },
          {
            "x": 16,
            "y": 3
          },
          {
            "x": 16,
            "y": 7
          },
          {
            "x": 12,
            "y": 7
          }
        ],
        "speed": 48
      }
    ],
    "lasers": [],
    "charges": {
      "decoy": 0,
      "emp": 0
    }
  },
  {
    "id": 3,
    "title": "Un bruit dans le silence",
    "subtitle": "Une diversion ouvre un passage.",
    "act": 1,
    "story": "La salle des donateurs contient un bijou saisi dans un atelier. Mara a glissé des capsules sonores dans ton sac. « Un bruit au bon endroit vaut mieux qu’une course. »",
    "epilogue": "L’atelier pourra rouvrir. Dans les archives de Vesper, une facture désigne maintenant les pièces de l’aile orientale.",
    "hint": "Appuie sur Q pour lancer un leurre vers le pointeur. Le garde enquête quelques secondes : profite de ce détour.",
    "par": 70,
    "tiles": [
      "####################",
      "#..................#",
      "#..................#",
      "#..................#",
      "#....##.....##.....#",
      "#....##.....##.....#",
      "#....##.....##.....#",
      "#....##.....##.....#",
      "#..................#",
      "#..................#",
      "#..................#",
      "####################"
    ],
    "player": {
      "x": 2,
      "y": 9
    },
    "exit": {
      "x": 17,
      "y": 9
    },
    "loot": [
      {
        "x": 9,
        "y": 2,
        "name": "Le pendentif de l’atelier",
        "asset": "gem"
      },
      {
        "x": 16,
        "y": 5,
        "name": "Les deux sœurs",
        "asset": "painting"
      },
      {
        "x": 3,
        "y": 3,
        "name": "Le petit veilleur",
        "asset": "statue"
      }
    ],
    "guards": [
      {
        "path": [
          {
            "x": 7,
            "y": 2
          },
          {
            "x": 16,
            "y": 2
          }
        ],
        "speed": 48
      }
    ],
    "lasers": [],
    "charges": {
      "decoy": 3,
      "emp": 0
    }
  },
  {
    "id": 4,
    "title": "La ligne rouge",
    "subtitle": "Six secondes de silence électronique.",
    "act": 2,
    "story": "L’aile orientale possède des barrières laser. Le brouilleur de Mara coupe les faisceaux pendant six secondes. Son conseil : « Choisis ton passage avant de l’activer. »",
    "epilogue": "Le registre des saisies confirme les soupçons de Mara : Vesper préparait une vente privée dès demain matin.",
    "hint": "Les lasers alternent trois secondes actifs et deux secondes éteints. Appuie sur E pour les neutraliser six secondes.",
    "par": 70,
    "tiles": [
      "####################",
      "#........#.........#",
      "#........#.........#",
      "#..................#",
      "#..................#",
      "#..................#",
      "#........#.........#",
      "#........#.........#",
      "#..................#",
      "#..................#",
      "#........#.........#",
      "####################"
    ],
    "player": {
      "x": 2,
      "y": 9
    },
    "exit": {
      "x": 2,
      "y": 2
    },
    "loot": [
      {
        "x": 15,
        "y": 2,
        "name": "La ville après la pluie",
        "asset": "painting"
      },
      {
        "x": 15,
        "y": 9,
        "name": "Le cristal des veillées",
        "asset": "gem"
      }
    ],
    "guards": [],
    "lasers": [
      {
        "a": {
          "x": 9,
          "y": 3
        },
        "b": {
          "x": 9,
          "y": 5
        },
        "phase": 0
      },
      {
        "a": {
          "x": 9,
          "y": 8
        },
        "b": {
          "x": 9,
          "y": 9
        },
        "phase": 1
      }
    ],
    "charges": {
      "decoy": 0,
      "emp": 2
    }
  },
  {
    "id": 5,
    "title": "Le salon des miroirs",
    "subtitle": "Attendre, détourner, traverser.",
    "act": 2,
    "story": "Le salon privé réunit les prises préférées de Vesper. Un garde surveille les vitrines tandis que les lasers protègent les passages centraux. Deux chemins existent : patienter dans l’ombre ou créer une ouverture.",
    "epilogue": "Une sculpture rejoint les caisses de restitution. Mara te prévient : « Les preuves sont aussi précieuses que les œuvres. Continue. »",
    "hint": "Observe d’abord le garde et les lasers. Une diversion ne coupe pas un faisceau ; le brouilleur ne détourne pas un garde.",
    "par": 85,
    "tiles": [
      "####################",
      "#..................#",
      "#..................#",
      "#....##.....##.....#",
      "#....##.....##.....#",
      "#..................#",
      "#..................#",
      "#....##.....##.....#",
      "#....##.....##.....#",
      "#..................#",
      "#..................#",
      "####################"
    ],
    "player": {
      "x": 2,
      "y": 9
    },
    "exit": {
      "x": 17,
      "y": 9
    },
    "loot": [
      {
        "x": 3,
        "y": 2,
        "name": "Les mains du potier",
        "asset": "statue"
      },
      {
        "x": 10,
        "y": 5,
        "name": "Le bleu retrouvé",
        "asset": "gem"
      },
      {
        "x": 16,
        "y": 2,
        "name": "La fenêtre ouverte",
        "asset": "painting"
      }
    ],
    "guards": [
      {
        "path": [
          {
            "x": 8,
            "y": 2
          },
          {
            "x": 16,
            "y": 2
          }
        ],
        "speed": 48
      },
      {
        "path": [
          {
            "x": 8,
            "y": 9
          },
          {
            "x": 16,
            "y": 9
          }
        ],
        "speed": 46
      }
    ],
    "lasers": [
      {
        "a": {
          "x": 7,
          "y": 5
        },
        "b": {
          "x": 12,
          "y": 5
        },
        "phase": 0
      }
    ],
    "charges": {
      "decoy": 3,
      "emp": 2
    }
  },
  {
    "id": 6,
    "title": "Les archives de verre",
    "subtitle": "Deux galeries, une même sortie.",
    "act": 2,
    "story": "Derrière les vitrines, les inventaires relient chaque objet à son propriétaire. Mara numérise les preuves pendant que tu récupères les pièces promises aux enchères.",
    "epilogue": "Les documents sont à l’abri. Au dehors, les premiers propriétaires arrivent discrètement pour préparer le retour des œuvres.",
    "hint": "Les ressources sont propres à chaque salle. Utilise-les ici : elles seront renouvelées au prochain niveau.",
    "par": 90,
    "tiles": [
      "####################",
      "#.....#............#",
      "#.....#............#",
      "#............#.....#",
      "#............#.....#",
      "#............#.....#",
      "#.....#............#",
      "#.....#............#",
      "#.....#............#",
      "#............#.....#",
      "#............#.....#",
      "####################"
    ],
    "player": {
      "x": 2,
      "y": 9
    },
    "exit": {
      "x": 17,
      "y": 9
    },
    "loot": [
      {
        "x": 3,
        "y": 2,
        "name": "L’encrier de l’école",
        "asset": "statue"
      },
      {
        "x": 10,
        "y": 2,
        "name": "La carte des saisons",
        "asset": "painting"
      },
      {
        "x": 16,
        "y": 2,
        "name": "Le verre de l’aurore",
        "asset": "gem"
      }
    ],
    "guards": [
      {
        "path": [
          {
            "x": 8,
            "y": 4
          },
          {
            "x": 11,
            "y": 4
          },
          {
            "x": 11,
            "y": 8
          },
          {
            "x": 8,
            "y": 8
          }
        ],
        "speed": 48
      },
      {
        "path": [
          {
            "x": 15,
            "y": 4
          },
          {
            "x": 17,
            "y": 4
          },
          {
            "x": 17,
            "y": 8
          },
          {
            "x": 15,
            "y": 8
          }
        ],
        "speed": 45
      }
    ],
    "lasers": [
      {
        "a": {
          "x": 6,
          "y": 3
        },
        "b": {
          "x": 6,
          "y": 5
        },
        "phase": 0
      },
      {
        "a": {
          "x": 13,
          "y": 6
        },
        "b": {
          "x": 13,
          "y": 8
        },
        "phase": 2
      }
    ],
    "charges": {
      "decoy": 3,
      "emp": 2
    }
  },
  {
    "id": 7,
    "title": "Le jardin intérieur",
    "subtitle": "Les rondes se croisent. Pas toi.",
    "act": 3,
    "story": "La verrière donne sur le coffre d’exposition. Le quartier attend tes derniers colis. Mara repère deux rondes : « Chaque garde a son rythme. N’essaie pas de battre les deux à la course. »",
    "epilogue": "La verrière s’assombrit derrière toi. Les preuves de confiscation sont désormais publiques. Il reste à sauver les dernières pièces avant leur départ.",
    "hint": "Les gros massifs de murs brisent la ligne de vue. Fais une étape à couvert avant de changer de côté.",
    "par": 95,
    "tiles": [
      "####################",
      "#..................#",
      "#..................#",
      "#....###....###....#",
      "#....###....###....#",
      "#..................#",
      "#..................#",
      "#....###....###....#",
      "#....###....###....#",
      "#..................#",
      "#..................#",
      "####################"
    ],
    "player": {
      "x": 2,
      "y": 9
    },
    "exit": {
      "x": 17,
      "y": 9
    },
    "loot": [
      {
        "x": 3,
        "y": 2,
        "name": "La lune des récoltes",
        "asset": "gem"
      },
      {
        "x": 10,
        "y": 5,
        "name": "Le cerf de la forêt",
        "asset": "statue"
      },
      {
        "x": 16,
        "y": 2,
        "name": "Le jardin de nuit",
        "asset": "painting"
      }
    ],
    "guards": [
      {
        "path": [
          {
            "x": 3,
            "y": 5
          },
          {
            "x": 8,
            "y": 5
          }
        ],
        "speed": 48
      },
      {
        "path": [
          {
            "x": 11,
            "y": 6
          },
          {
            "x": 17,
            "y": 6
          }
        ],
        "speed": 48
      }
    ],
    "lasers": [
      {
        "a": {
          "x": 9,
          "y": 2
        },
        "b": {
          "x": 11,
          "y": 2
        },
        "phase": 0
      },
      {
        "a": {
          "x": 9,
          "y": 9
        },
        "b": {
          "x": 11,
          "y": 9
        },
        "phase": 2
      }
    ],
    "charges": {
      "decoy": 3,
      "emp": 3
    }
  },
  {
    "id": 8,
    "title": "La collection privée",
    "subtitle": "Le dernier inventaire de Vesper.",
    "act": 3,
    "story": "Quatre pièces attendent dans la collection privée. Leurs anciennes étiquettes ont été arrachées, mais Mara a retrouvé tous les noms. Cette salle ne sera plus jamais anonyme.",
    "epilogue": "Les caisses de vente sont vides. Dans la dernière galerie demeure la pièce que Vesper présentait comme le symbole de sa fortune : une œuvre collective volée à la ville.",
    "hint": "Choisis l’ordre des œuvres librement. Un détour sûr vaut mieux qu’une traversée précipitée entre deux rondes.",
    "par": 115,
    "tiles": [
      "####################",
      "#..................#",
      "#..................#",
      "#....##......##....#",
      "#....##..##..##....#",
      "#........##........#",
      "#........##........#",
      "#....##..##..##....#",
      "#....##......##....#",
      "#..................#",
      "#..................#",
      "####################"
    ],
    "player": {
      "x": 2,
      "y": 9
    },
    "exit": {
      "x": 17,
      "y": 9
    },
    "loot": [
      {
        "x": 3,
        "y": 2,
        "name": "La comète de Selma",
        "asset": "gem"
      },
      {
        "x": 17,
        "y": 2,
        "name": "La maison bleue",
        "asset": "painting"
      },
      {
        "x": 3,
        "y": 6,
        "name": "La danseuse de terre",
        "asset": "statue"
      },
      {
        "x": 17,
        "y": 6,
        "name": "Le soleil d’ambre",
        "asset": "gem"
      }
    ],
    "guards": [
      {
        "path": [
          {
            "x": 7,
            "y": 2
          },
          {
            "x": 12,
            "y": 2
          }
        ],
        "speed": 45
      },
      {
        "path": [
          {
            "x": 7,
            "y": 9
          },
          {
            "x": 12,
            "y": 9
          }
        ],
        "speed": 45
      },
      {
        "path": [
          {
            "x": 16,
            "y": 4
          },
          {
            "x": 18,
            "y": 4
          },
          {
            "x": 18,
            "y": 8
          },
          {
            "x": 16,
            "y": 8
          }
        ],
        "speed": 43
      }
    ],
    "lasers": [
      {
        "a": {
          "x": 3,
          "y": 5
        },
        "b": {
          "x": 7,
          "y": 5
        },
        "phase": 0
      },
      {
        "a": {
          "x": 12,
          "y": 5
        },
        "b": {
          "x": 17,
          "y": 5
        },
        "phase": 2
      },
      {
        "a": {
          "x": 8,
          "y": 8
        },
        "b": {
          "x": 12,
          "y": 8
        },
        "phase": 1
      }
    ],
    "charges": {
      "decoy": 4,
      "emp": 3
    }
  },
  {
    "id": 9,
    "title": "La salle de l’aube",
    "subtitle": "Cette nuit, on rend la lumière.",
    "act": 3,
    "story": "La dernière galerie abrite le triptyque de l’aube. Des centaines d’habitants l’avaient offert à la ville ; Vesper s’en était emparé avec le reste. « Récupère les trois pièces, puis rejoins-nous », souffle Mara.",
    "epilogue": "Au matin, les trois pièces retrouvent la place du quartier. Les propriétaires récupèrent leurs œuvres et les archives établissent les faits. Vesper devra répondre de ses actes. Mara te tend un café : « Tu sais ce qu’on a volé cette nuit ? Son droit de tout garder. »",
    "hint": "Tu connais tous les outils : reste à couvert, détourne les rondes, puis coupe les faisceaux au moment de traverser.",
    "par": 120,
    "tiles": [
      "####################",
      "#..................#",
      "#..................#",
      "#....###....###....#",
      "#....###....###....#",
      "#........##........#",
      "#........##........#",
      "#....###....###....#",
      "#....###....###....#",
      "#..................#",
      "#..................#",
      "####################"
    ],
    "player": {
      "x": 2,
      "y": 9
    },
    "exit": {
      "x": 17,
      "y": 9
    },
    "loot": [
      {
        "x": 3,
        "y": 2,
        "name": "L’aube — la mémoire",
        "asset": "painting"
      },
      {
        "x": 10,
        "y": 2,
        "name": "L’aube — le présent",
        "asset": "statue"
      },
      {
        "x": 17,
        "y": 2,
        "name": "L’aube — la promesse",
        "asset": "gem"
      }
    ],
    "guards": [
      {
        "path": [
          {
            "x": 2,
            "y": 5
          },
          {
            "x": 4,
            "y": 5
          },
          {
            "x": 4,
            "y": 8
          },
          {
            "x": 2,
            "y": 8
          }
        ],
        "speed": 44
      },
      {
        "path": [
          {
            "x": 8,
            "y": 2
          },
          {
            "x": 12,
            "y": 2
          }
        ],
        "speed": 43
      },
      {
        "path": [
          {
            "x": 16,
            "y": 5
          },
          {
            "x": 18,
            "y": 5
          },
          {
            "x": 18,
            "y": 8
          },
          {
            "x": 16,
            "y": 8
          }
        ],
        "speed": 44
      }
    ],
    "lasers": [
      {
        "a": {
          "x": 8,
          "y": 3
        },
        "b": {
          "x": 11,
          "y": 3
        },
        "phase": 0
      },
      {
        "a": {
          "x": 8,
          "y": 8
        },
        "b": {
          "x": 11,
          "y": 8
        },
        "phase": 2
      },
      {
        "a": {
          "x": 15,
          "y": 5
        },
        "b": {
          "x": 18,
          "y": 5
        },
        "phase": 1
      }
    ],
    "charges": {
      "decoy": 4,
      "emp": 3
    }
  }
];
