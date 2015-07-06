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

package org.bson.jvm;

import org.bson.codecs.configuration.CodecRegistry;

import com.mongodb.MongoClient;
import com.mongodb.client.MongoCollection;

/**
 * Implements BSON conversion for a specific environment.
 * 
 * @author Tal Liron
 * @see Bson
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
	 * An implementation-specific document class to be used for
	 * {@link MongoCollection}.
	 * 
	 * @return The document class
	 */
	public Class<?> getDocumentClass();

	/**
	 * The codec registry to be used for {@link MongoClient}.
	 * 
	 * @return The codec registry
	 */
	public CodecRegistry getCodecRegistry( CodecRegistry next );

	/**
	 * Convert a JVM {@link String} to an implementation-specific string type.
	 * 
	 * @param string
	 *        The JVM string
	 * @return An implementation-specific string
	 */
	public Object createString( String string );
}
