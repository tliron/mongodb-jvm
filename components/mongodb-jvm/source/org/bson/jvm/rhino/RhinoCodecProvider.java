/**
 * Copyright 2010-2016 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package org.bson.jvm.rhino;

import java.util.HashMap;
import java.util.Map;

import org.bson.BsonType;
import org.bson.Document;
import org.bson.codecs.BsonTypeClassMap;
import org.bson.codecs.Codec;
import org.bson.codecs.DocumentCodec;
import org.bson.codecs.configuration.CodecProvider;
import org.bson.codecs.configuration.CodecRegistry;
import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.Undefined;
import org.mozilla.javascript.Wrapper;

import com.mongodb.DBObject;
import com.mongodb.DBObjectCodec;

/**
 * Provides codecs for Rhino types that require access to a
 * {@link CodecRegistry} and {@link BsonTypeClassMap}, or that are private
 * classes in Rhino.
 * 
 * @author Tal Liron
 */
public class RhinoCodecProvider implements CodecProvider
{
	//
	// Construction
	//

	public RhinoCodecProvider()
	{
		// We are using codec classes for some of these here as placeholders,
		// because the actual target classes in those cases are private in Rhino
		Map<BsonType, Class<?>> replacements = new HashMap<BsonType, Class<?>>();
		replacements.put( BsonType.ARRAY, NativeArray.class );
		replacements.put( BsonType.BOOLEAN, NativeBooleanCodec.class );
		replacements.put( BsonType.DATE_TIME, NativeDateCodec.class );
		replacements.put( BsonType.DOCUMENT, Scriptable.class );
		replacements.put( BsonType.DOUBLE, NativeNumberCodec.class );
		replacements.put( BsonType.REGULAR_EXPRESSION, NativeRegExpCodec.class );
		replacements.put( BsonType.STRING, NativeStringCodec.class );
		replacements.put( BsonType.UNDEFINED, Undefined.class );
		bsonTypeClassMap = new BsonTypeClassMap( replacements );
	}

	//
	// CodecProvider
	//

	@SuppressWarnings("unchecked")
	public <T> Codec<T> get( Class<T> clazz, CodecRegistry registry )
	{
		if( clazz == Document.class )
			return (Codec<T>) new DocumentCodec( registry, bsonTypeClassMap );
		else if( clazz == DBObject.class )
			return (Codec<T>) new DBObjectCodec( registry, bsonTypeClassMap );
		else if( clazz == NativeArray.class )
			return (Codec<T>) new NativeArrayCodec( registry, bsonTypeClassMap );
		else if( Wrapper.class.isAssignableFrom( clazz ) )
			return (Codec<T>) new WrapperCodec( registry );
		// Handle private classes
		String name = clazz.getCanonicalName();
		if( name.equals( "org.mozilla.javascript.NativeBoolean" ) )
			return new NativeBooleanCodec();
		else if( name.equals( "org.mozilla.javascript.NativeDate" ) )
			return new NativeDateCodec();
		else if( name.equals( "org.mozilla.javascript.NativeNumber" ) )
			return new NativeNumberCodec();
		else if( name.equals( "org.mozilla.javascript.regexp.NativeRegExp" ) )
			return new NativeRegExpCodec();
		else if( name.equals( "org.mozilla.javascript.NativeString" ) )
			return new NativeStringCodec();
		// Make sure Scriptable is last
		else if( Scriptable.class.isAssignableFrom( clazz ) )
			return (Codec<T>) new ScriptableCodec( registry, bsonTypeClassMap );
		return null;
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	private final BsonTypeClassMap bsonTypeClassMap;
}
