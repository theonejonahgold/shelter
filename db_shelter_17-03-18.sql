# ************************************************************
# Sequel Pro SQL dump
# Version 4541
#
# http://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Host: localhost (MySQL 5.7.21)
# Database: shelter
# Generation Time: 2018-03-17 11:47:19 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table animals
# ------------------------------------------------------------

DROP TABLE IF EXISTS `animals`;

CREATE TABLE `animals` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL DEFAULT '',
  `description` varchar(191) DEFAULT NULL,
  `type` int(11) unsigned NOT NULL,
  `place` int(11) unsigned NOT NULL,
  `intake` date NOT NULL,
  `sex` int(11) unsigned NOT NULL,
  `age` int(11) unsigned NOT NULL,
  `weight` float DEFAULT NULL,
  `size` int(11) unsigned DEFAULT NULL,
  `length` int(11) unsigned DEFAULT NULL,
  `coat` int(11) unsigned DEFAULT NULL,
  `vaccinated` tinyint(1) NOT NULL,
  `declawed` tinyint(1) DEFAULT NULL,
  `primary_color` varchar(191) NOT NULL DEFAULT '',
  `secondary_color` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `animal_type` (`type`),
  KEY `animal_sex` (`sex`),
  KEY `animal_size` (`size`),
  KEY `animal_length` (`length`),
  KEY `animal_coat` (`coat`),
  KEY `animal_place` (`place`),
  CONSTRAINT `animal_coat` FOREIGN KEY (`coat`) REFERENCES `coats` (`id`),
  CONSTRAINT `animal_length` FOREIGN KEY (`length`) REFERENCES `lengths` (`id`),
  CONSTRAINT `animal_place` FOREIGN KEY (`place`) REFERENCES `locations` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `animal_sex` FOREIGN KEY (`sex`) REFERENCES `sex` (`id`),
  CONSTRAINT `animal_size` FOREIGN KEY (`size`) REFERENCES `sizes` (`id`),
  CONSTRAINT `animal_type` FOREIGN KEY (`type`) REFERENCES `types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table coats
# ------------------------------------------------------------

DROP TABLE IF EXISTS `coats`;

CREATE TABLE `coats` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

LOCK TABLES `coats` WRITE;
/*!40000 ALTER TABLE `coats` DISABLE KEYS */;

INSERT INTO `coats` (`id`, `name`)
VALUES
	(1,'smooth'),
	(2,'thick');

/*!40000 ALTER TABLE `coats` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table lengths
# ------------------------------------------------------------

DROP TABLE IF EXISTS `lengths`;

CREATE TABLE `lengths` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

LOCK TABLES `lengths` WRITE;
/*!40000 ALTER TABLE `lengths` DISABLE KEYS */;

INSERT INTO `lengths` (`id`, `name`)
VALUES
	(1,'short'),
	(2,'medium'),
	(3,'long');

/*!40000 ALTER TABLE `lengths` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table location_type_permission
# ------------------------------------------------------------

DROP TABLE IF EXISTS `location_type_permission`;

CREATE TABLE `location_type_permission` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `location_id` int(11) unsigned NOT NULL,
  `type_id` int(11) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `location` (`location_id`),
  KEY `type` (`type_id`),
  CONSTRAINT `location` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `type` FOREIGN KEY (`type_id`) REFERENCES `types` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8;

LOCK TABLES `location_type_permission` WRITE;
/*!40000 ALTER TABLE `location_type_permission` DISABLE KEYS */;

INSERT INTO `location_type_permission` (`id`, `location_id`, `type_id`)
VALUES
	(2,1,1),
	(3,1,2),
	(4,1,3),
	(5,2,1),
	(6,2,2),
	(7,2,3),
	(8,3,1),
	(9,3,2),
	(10,3,3);

/*!40000 ALTER TABLE `location_type_permission` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table locations
# ------------------------------------------------------------

DROP TABLE IF EXISTS `locations`;

CREATE TABLE `locations` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL DEFAULT '',
  `capacity` int(11) DEFAULT NULL,
  `street` varchar(191) DEFAULT NULL,
  `postal code` char(11) DEFAULT NULL,
  `city` varchar(191) DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

LOCK TABLES `locations` WRITE;
/*!40000 ALTER TABLE `locations` DISABLE KEYS */;

INSERT INTO `locations` (`id`, `name`, `capacity`, `street`, `postal code`, `city`)
VALUES
	(1,'Brooklyn Animal Care Center',NULL,NULL,NULL,'Brooklyn'),
	(2,'Manhatten Animal Care Center',NULL,NULL,NULL,'Manhatten'),
	(3,'Staten Island Animal Care Center',NULL,NULL,NULL,'Staten Island');

/*!40000 ALTER TABLE `locations` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table sex
# ------------------------------------------------------------

DROP TABLE IF EXISTS `sex`;

CREATE TABLE `sex` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

LOCK TABLES `sex` WRITE;
/*!40000 ALTER TABLE `sex` DISABLE KEYS */;

INSERT INTO `sex` (`id`, `name`)
VALUES
	(1,'male'),
	(2,'female');

/*!40000 ALTER TABLE `sex` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table sizes
# ------------------------------------------------------------

DROP TABLE IF EXISTS `sizes`;

CREATE TABLE `sizes` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

LOCK TABLES `sizes` WRITE;
/*!40000 ALTER TABLE `sizes` DISABLE KEYS */;

INSERT INTO `sizes` (`id`, `name`)
VALUES
	(1,'small'),
	(2,'medium'),
	(3,'large');

/*!40000 ALTER TABLE `sizes` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table types
# ------------------------------------------------------------

DROP TABLE IF EXISTS `types`;

CREATE TABLE `types` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

LOCK TABLES `types` WRITE;
/*!40000 ALTER TABLE `types` DISABLE KEYS */;

INSERT INTO `types` (`id`, `name`)
VALUES
	(1,'dog'),
	(2,'cat'),
	(3,'rabbit');

/*!40000 ALTER TABLE `types` ENABLE KEYS */;
UNLOCK TABLES;



/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
