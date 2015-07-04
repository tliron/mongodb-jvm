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

import java.util.HashMap;
import java.util.Map;

import org.bson.BsonDocument;
import org.bson.BsonDocumentWrapper;
import org.bson.Document;
import org.bson.codecs.configuration.CodecRegistry;
import org.bson.json.JsonWriterSettings;

import com.mongodb.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.jvm.nashorn.NashornBsonImp;
import com.threecrickets.scripturian.ExecutionContext;
import com.threecrickets.scripturian.LanguageAdapter;

/**
 * @author Tal Liron
 */
public class Bson
{
	/**
	 * The document class to be used for {@link MongoCollection}, as appropriate
	 * for the current Scripturian {@link LanguageAdapter}. It is likely a
	 * native type of the current language engine.
	 * 
	 * @return The document class
	 */
	public static Class<?> getDocumentClass()
	{
		return getImplementation().getDocumentClass();
	}

	/**
	 * The codec registry to be used for {@link MongoClient}, as appropriate for
	 * the current Scripturian {@link LanguageAdapter}.
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
	 * The codec registry to be used for {@link MongoClient} for the current
	 * Scripturian {@link LanguageAdapter}. The driver's default codec registry
	 * will be used after ours.
	 * 
	 * @return The codec registry
	 */
	public static CodecRegistry getCodecRegistry()
	{
		return getCodecRegistry( MongoClient.getDefaultCodecRegistry() );
	}

	/**
	 * Convert any object to a {@link BsonDocument}, specifically supporting
	 * native types of the current Scripturian {@link LanguageAdapter}.
	 * 
	 * @param object
	 *        The object
	 * @return A BSON document
	 */
	public static BsonDocument to( Object object )
	{
		return BsonDocumentWrapper.asBsonDocument( object, getCodecRegistry() );
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
	 * Convert a {@link Document} or a {@link BsonDocument} to JSON text. The
	 * result is in a native string type appropriate for the current Scripturian
	 * {@link LanguageAdapter}.
	 * 
	 * @param o
	 *        The object
	 * @param indent
	 *        Whether to indent the JSON text
	 * @return A native string, or null if not converted
	 */
	public static Object toJson( Object o, boolean indent )
	{
		String r = null;
		JsonWriterSettings settings = new JsonWriterSettings( indent );

		if( o instanceof Document )
			r = ( (Document) o ).toJson( settings );
		else if( o instanceof BsonDocument )
			r = ( (BsonDocument) o ).toJson( settings );

		if( r == null )
			return null;
		else
			return getImplementation().toNativeString( r );
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	private static final Map<String, BsonImp> implementations = new HashMap<String, BsonImp>();

	/**
	 * The implementation for the current Scripturian {@link LanguageAdapter}.
	 * 
	 * @return The implementation
	 */
	private static BsonImp getImplementation()
	{
		return implementations.get( getLanguageAdapterName() );
	}

	/**
	 * The name of the current Scripturian {@link LanguageAdapter}.
	 * 
	 * @return The language adapter name
	 */
	private static String getLanguageAdapterName()
	{
		return (String) ExecutionContext.getCurrent().getAdapter().getAttributes().get( LanguageAdapter.NAME );
	}

	static
	{
		try
		{
			implementations.put( "Nashorn", new NashornBsonImp() );
		}
		catch( NoClassDefFoundError x )
		{
		}
		catch( UnsupportedClassVersionError x )
		{
		}

		// implementations.put( RhinoAdapter.NAME, new NashornBsonImp() );
	}

	private Bson()
	{
	}
}
