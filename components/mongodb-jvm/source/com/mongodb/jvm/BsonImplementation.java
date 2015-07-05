/**
 * Copyright 2010-2015 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package com.mongodb.jvm;

import org.bson.codecs.configuration.CodecRegistry;

import com.mongodb.MongoClient;
import com.mongodb.client.MongoCollection;
import com.threecrickets.scripturian.LanguageAdapter;

/**
 * @author Tal Liron
 */
public interface BsonImplementation
{
	/**
	 * The name of this implementation.
	 * 
	 * @return The name of this implementation
	 */
	public String getName();

	/**
	 * The priority of this implementation. Higher numbers mean higher priority.
	 * 
	 * @return The priority of this implementation
	 */
	public int getPriority();

	/**
	 * The document class to be used for {@link MongoCollection}, as appropriate
	 * for the current Scripturian {@link LanguageAdapter}. It is likely a
	 * native type of the current language engine.
	 * 
	 * @return The document class
	 */
	public Class<?> getDocumentClass();

	/**
	 * The codec registry to be used for {@link MongoClient} for the current
	 * Scripturian {@link LanguageAdapter}. The driver's default codec registry
	 * will be used after ours.
	 * 
	 * @return The codec registry
	 */
	public CodecRegistry getCodecRegistry( CodecRegistry next );

	/**
	 * Convert a JVM {@link String} to a native string type appropriate for the
	 * current Scripturian {@link LanguageAdapter}.
	 * 
	 * @param string
	 *        The JVM string
	 * @return A native string
	 */
	public Object toNativeString( String string );
}
