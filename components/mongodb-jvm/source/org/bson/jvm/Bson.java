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

import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.ServiceLoader;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import org.bson.BsonDocument;
import org.bson.BsonDocumentWriter;
import org.bson.Document;
import org.bson.codecs.Codec;
import org.bson.codecs.EncoderContext;
import org.bson.codecs.configuration.CodecRegistry;
import org.bson.json.JsonWriterSettings;

import com.mongodb.MongoClient;
import com.mongodb.client.MongoCollection;

/**
 * Conversion to and from BSON and native objects.
 * 
 * @author Tal Liron
 */
public class Bson
{
	//
	// Static attributes
	//

	/**
	 * The implementation used by the static methods in this class.
	 * <p>
	 * By default, it is the implementation for the current Scripturian
	 * {@link com.threecrickets.scripturian.LanguageAdapter}. If there is none
	 * available, the dummy {@link DefaultBsonImplementation} will be used.
	 * <p>
	 * You can override this behavior and set a specific implementation using
	 * {@link #setImplementation(BsonImplementation)}.
	 * 
	 * @return The implementation
	 */
	public static BsonImplementation getImplementation()
	{
		BsonImplementation implementation = Bson.implementation;
		if( implementation != null )
			return implementation;
		else
		{
			implementation = implementations.get( getLanguageAdapterName() );
			if( implementation == null )
				implementation = new DefaultBsonImplementation();
			return implementation;
		}
	}

	/**
	 * Sets the implementation to be used by the static methods in this class.
	 * If set to null (the default) will use the implementation for the current
	 * Scripturian {@link com.threecrickets.scripturian.LanguageAdapter}
	 * 
	 * @param implementation
	 *        The new implementation or null
	 */
	public static void setImplementation( BsonImplementation implementation )
	{
		Bson.implementation = implementation;
	}

	/**
	 * All available implementations.
	 * 
	 * @return The implementations
	 */
	public static Collection<BsonImplementation> getImplementations()
	{
		return Collections.unmodifiableCollection( implementations.values() );
	}

	/**
	 * The implementation-specific document class to be used for
	 * {@link MongoCollection}.
	 * 
	 * @return The document class
	 */
	public static Class<?> getDocumentClass()
	{
		return getImplementation().getDocumentClass();
	}

	/**
	 * The codec registry to be used for {@link MongoClient}.
	 * 
	 * @param next
	 *        The next codec registry to be used after ours
	 * @return The codec registry
	 */
	public static CodecRegistry getCodecRegistry( CodecRegistry next )
	{
		return getImplementation().getCodecRegistry( next );
	}

	/**
	 * The codec registry to be used for {@link MongoClient}. The driver's
	 * default codec registry will be appended after ours.
	 * <p>
	 * Note that the results of this method are cached, unlike
	 * {@link #getCodecRegistry(CodecRegistry)}.
	 * 
	 * @return The codec registry
	 */
	public static CodecRegistry getCodecRegistry()
	{
		BsonImplementation implementation = getImplementation();
		CodecRegistry codecRegistry = codecRegistries.get( implementation );
		if( codecRegistry == null )
		{
			codecRegistry = getCodecRegistry( MongoClient.getDefaultCodecRegistry() );
			CodecRegistry existing = codecRegistries.putIfAbsent( implementation, codecRegistry );
			if( existing != null )
				codecRegistry = existing;
		}
		return codecRegistry;
	}

	//
	// Static operations
	//

	/**
	 * Convert any object to a {@link BsonDocument}, specifically supporting
	 * implementation-specific types.
	 * 
	 * @param object
	 *        The object
	 * @return A BSON document
	 */
	public static BsonDocument to( Object object )
	{
		if( object == null )
			return null;

		@SuppressWarnings("unchecked")
		Codec<Object> codec = (Codec<Object>) getCodecRegistry().get( object.getClass() );
		BsonDocument bson = new BsonDocument();
		codec.encode( new BsonDocumentWriter( bson ), object, EncoderContext.builder().build() );
		return bson;
	}

	/**
	 * Convert JSON text to a {@link BsonDocument}.
	 * 
	 * @param json
	 *        The JSON text
	 * @return A BSON document
	 */
	public static BsonDocument fromJson( String json )
	{
		return BsonDocument.parse( json );
	}

	/**
	 * Convert a BSON object to JSON text. The result is in an
	 * implementation-specific string type.
	 * 
	 * @param o
	 *        A {@link BsonDocument} or a {@link Document}
	 * @param indent
	 *        Whether to indent the JSON text
	 * @return An implementation-specific string, or null if not converted
	 */
	public static Object toJson( Object o, boolean indent )
	{
		String r = null;
		JsonWriterSettings settings = new JsonWriterSettings( indent );

		if( o instanceof BsonDocument )
			r = ( (BsonDocument) o ).toJson( settings );
		else if( o instanceof Document )
			r = ( (Document) o ).toJson( settings );

		if( r == null )
			return null;
		else
			return getImplementation().createString( r );
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	private static volatile BsonImplementation implementation;

	private static final Map<String, BsonImplementation> implementations = new HashMap<String, BsonImplementation>();

	private static final ConcurrentMap<BsonImplementation, CodecRegistry> codecRegistries = new ConcurrentHashMap<BsonImplementation, CodecRegistry>();

	/**
	 * The name of the current Scripturian
	 * {@link com.threecrickets.scripturian.LanguageAdapter}.
	 * 
	 * @return The language adapter name
	 */
	private static String getLanguageAdapterName()
	{
		try
		{
			return (String) com.threecrickets.scripturian.ExecutionContext.getCurrent().getAdapter().getAttributes().get( com.threecrickets.scripturian.LanguageAdapter.NAME );
		}
		catch( NoClassDefFoundError x )
		{
			return null;
		}
	}

	static
	{
		ServiceLoader<BsonImplementation> implementationLoader = ServiceLoader.load( BsonImplementation.class, Bson.class.getClassLoader() );
		for( Iterator<BsonImplementation> i = implementationLoader.iterator(); i.hasNext(); )
		{
			BsonImplementation implementation;
			try
			{
				implementation = i.next();
			}
			catch( Throwable x )
			{
				// Probably a ClassNotFoundException
				continue;
			}
			BsonImplementation existing = implementations.get( implementation.getName() );
			if( ( existing == null ) || ( implementation.getPriority() > existing.getPriority() ) )
				implementations.put( implementation.getName(), implementation );
		}
	}

	private Bson()
	{
	}
}
